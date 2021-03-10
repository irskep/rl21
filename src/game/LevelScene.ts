// import Mousetrap from "mousetrap";
import { InteractionEvent, Sprite } from "pixi.js";
import { Vector } from "vector2d";
import { Cell, Tilemap } from "./tilemap";
import { makeECS } from "../ecs/ecs";
import { CombatC } from "../ecs/CombatC";
import { ECS } from "../ecs/ecsTypes";
import { GameScene, GameInterface } from "../types";
import { Move, MoveCheckResult } from "../ecs/moves/_types";
import { Action, getActionText, interpretEvent } from "./input";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/sprite";
import { CombatEvent, CombatEventType } from "../ecs/CombatS";
import { MenuScene } from "../MenuScene";
import { DIFFICULTIES } from "../ecs/difficulties";
import Mousetrap from "mousetrap";
import { LevelSceneGfx } from "./LevelSceneGfx";

export class LevelScene implements GameScene {
  gfx: LevelSceneGfx;

  /* state management */

  ecs!: ECS;
  map = new Tilemap(new Vector(10, 10));
  possibleMoves: [Move, MoveCheckResult][] = [];

  // display
  hoveredPos: Vector | null = null;
  hoveredPosDuringUpdate: Vector | null = null;
  hoveredEntity: Entity | null = null;

  constructor(private game: GameInterface, public n: number) {
    this.gfx = new LevelSceneGfx(game, this.map);
  }

  goToNextScene() {
    if (this.n < DIFFICULTIES.length - 2) {
      this.game.replaceScenes([new LevelScene(this.game, this.n + 1)]);
    } else {
      this.game.replaceScenes([new MenuScene(this.game)]);
    }
  }

  private isInitialized = false;
  enter() {
    console.log("enter", this);
    Mousetrap.bind(["n"], () => this.goToNextScene());
    this.game.app.ticker.add(this.gameLoop);

    this.gfx.enter();

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.map.updateCells((cell) => {
        this.bindCellEvents(cell, cell.sprite!);
      });

      this.ecs = makeECS(
        this.game,
        this.gfx.arena,
        this.map,
        this.gfx.writeMessage,
        this.n
      );
      this.ecs.combatSystem.tilemap = this.map;
      this.updateTileSprites();
      this.ecs.engine.update(1);
      this.updateHUDText();
      this.updateHearts();
    }

    this.ecs.combatSystem.events.stream.onValue((event) => {
      this.handleCombatEvent(event);
    });

    this.gfx.writeMessage("Atman enters the room.");
  }

  exit() {
    console.log("exit", this);
    this.game.app.ticker.remove(this.gameLoop);
    this.gfx.exit();
    Mousetrap.unbind(["n"]);
  }

  bindCellEvents(cell: Cell, cellSprite: Sprite) {
    (cellSprite as any).on("mouseover", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) {
        this.hoveredPosDuringUpdate = cell.pos;
        return;
      }
      this.updateHoverCell(cell.pos);
    });

    (cellSprite as any).on("click", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) return;
      const action = interpretEvent(e);
      if (!action) return;
      this.handleClick(cell.pos, action);
    });

    (cellSprite as any).on("rightclick", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) return;
      const action = interpretEvent(e);
      if (!action) return;
      this.handleClick(cell.pos, action);
    });
  }

  updateTileSprites() {
    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cell = this.map.contents[y][x];
        cell.sprite!.texture = this.game.filmstrips.env[cell.index];
      }
    }
  }

  handleCombatEvent(event: CombatEvent) {
    console.log("Combat event:", event);
    switch (event.type) {
      case CombatEventType.HPChanged:
        if (event.subject === this.ecs.player) {
          this.updateHearts();
        }
        this.gfx.showFloatingText(
          event.subject!.getComponent(SpriteC)!.sprite!,
          `${event.value}`,
          "#ff6666"
        );
        break;
      case CombatEventType.Die:
        if (event.subject === this.ecs.player) {
          this.gfx.showLoss();

          setTimeout(() => {
            this.game.replaceScenes([new MenuScene(this.game)]);
          }, 2000);
        }
        break;
      case CombatEventType.AllEnemiesDead:
        this.gfx.showVictory();

        setTimeout(() => {
          this.goToNextScene();
        }, 2000);
    }
  }

  updateHoverCell(pos: Vector | null) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    this.updateHUDText();

    if (this.possibleMoves.filter(([m, r]) => r.success).length > 0) {
      this.gfx.hoverSprite.visible = true;
      this.gfx.hoverSprite.position.set(
        this.hoveredPos!.x * this.game.tileSize,
        this.hoveredPos!.y * this.game.tileSize
      );
    } else {
      this.gfx.hoverSprite.visible = false;
    }

    if (pos) {
      this.gfx.updateHoveredEntity(
        this.ecs.spriteSystem.findCombatEntity(pos) || null
      );
    } else {
      this.gfx.updateHoveredEntity(null);
    }
  }

  updatePossibleMoves() {
    if (!this.hoveredPos) {
      this.possibleMoves = this.ecs.player
        .getComponent(CombatC)
        .moves.map((m) => [m, { success: false }]);
      return;
    }

    this.possibleMoves = this.ecs.player
      .getComponent(CombatC)
      .moves.map((m) => [
        m,
        m.check({ ecs: this.ecs, entity: this.ecs.player }, this.hoveredPos!),
      ]);

    this.possibleMoves.sort(([moveA, resultA], [moveB, resultB]) => {
      if (resultA.success == resultB.success) {
        return moveA.name.localeCompare(moveB.name);
      } else if (resultA.success) {
        return -1;
      } else {
        return 1;
      }
    });
  }

  updateHUDText() {
    const okMoves = this.possibleMoves.filter((x) => x[1].success);
    const notOkMoves = this.possibleMoves.filter((x) => !x[1].success);
    this.gfx.dbgText.text = `${this.hoveredPos || "(no selection)"}\n`;
    let firstLine =
      "Possible moves: " +
      okMoves
        .map(([move]) => `${move.name} (${getActionText(move.action!)})`) // (${move.help})`)
        .join("; ");
    if (okMoves.length === 0) {
      firstLine = "No moves available at selected position";
    }

    // const secondLine =
    //   "Omitted: " +
    //   notOkMoves
    //     .map(([move, result]) => `${move.name} (${result.message || "?"})`)
    //     .join("; ");
    const secondLine =
      "If no moves are available, try moving your mouse around. Sometimes you need to click yourself.";

    this.gfx.inputHintText.text = firstLine + "\n\n" + secondLine;
  }

  updateHearts() {
    this.gfx.updateHearts(this.ecs.player.getComponent(CombatC).hp);
  }

  gameLoop = (dt: number) => {
    this.gfx.tick(dt);
  };

  tick = () => {
    console.groupEnd(); // player move
    this.ecs.combatSystem.onProcessingFinished = () => {
      console.log(
        "Finished processing action on " +
          this.hoveredPosDuringUpdate?.toString()
      );
      this.updateHoverCell(this.hoveredPosDuringUpdate);
      this.updateHearts();
    };
    this.ecs.engine.update(1);
  };

  handleClick(pos: Vector, action: Action) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    const actionMoves = this.possibleMoves.filter(
      ([move, result]) => result.success && move.action == action
    );
    if (actionMoves.length > 1) {
      console.log(actionMoves);
      throw new Error(`Conflicting moves: ${actionMoves}`);
    }
    this.hoveredPosDuringUpdate = this.hoveredPos;
    this.gfx.writeMessage("-----------------");
    if (actionMoves.length === 1) {
      this.updateHoverCell(null);
      this.ecs.combatSystem.reset(this.ecs.engine);
      this.ecs.combatSystem.isProcessing = true;

      console.group("Player move");
      console.log("Apply", actionMoves[0][0]);
      const isAsync = actionMoves[0][0].apply(
        { ecs: this.ecs, entity: this.ecs.player },
        pos,
        this.tick
      );
      if (!isAsync) this.tick();
    }
  }
}
