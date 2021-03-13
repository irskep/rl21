// import Mousetrap from "mousetrap";
import { InteractionEvent, Sprite } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { Cell, Tilemap } from "./tilemap";
import { makeECS } from "../ecs/ecs";
import { CombatC } from "../ecs/combat/CombatC";
import { ECS } from "../ecs/ecsTypes";
import { GameScene, GameInterface } from "../types";
import { Move, MoveCheckResult } from "../ecs/moves/_types";
import { Action, interpretEvent } from "./input";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/SpriteC";
import { CombatEvent, CombatEventType } from "../ecs/combat/CombatS";
import { MenuScene } from "../MenuScene";
import { DIFFICULTIES } from "../ecs/difficulties";
import Mousetrap from "mousetrap";
import { LevelSceneGfx } from "./LevelSceneGfx";
import { UpgradeScene } from "../UpgradeScene";
import { Upgrade } from "../ecs/upgrades";
import UnreachableCaseError from "../UnreachableCaseError";
import { SoundManager } from "../SoundManager";
import { Atarangs } from "../ecs/moves/Atarangs";
import { WinScene } from "../WinScene";
import { CombatTrait } from "../ecs/combat/CombatTrait";

export class LevelScene implements GameScene {
  gfx: LevelSceneGfx;

  /* state management */

  ecs!: ECS;
  map = new Tilemap(new Vector(10, 10));
  possibleMoves: [Move, MoveCheckResult][] = [];

  // display
  hoveredPos: AbstractVector | null = null;
  hoveredPosDuringUpdate: AbstractVector | null = null;
  hoveredEntity: Entity | null = null;
  isOver = false;

  constructor(
    private game: GameInterface,
    public n: number,
    private upgrades: Upgrade[]
  ) {
    this.gfx = new LevelSceneGfx(game, this.map);
    (window as any).levelScene = this;
  }

  goToNextScene() {
    if (this.n < DIFFICULTIES.length - 1) {
      this.game.replaceScenes([
        new UpgradeScene(this.game, this.n + 1, this.upgrades, this.ecs.rng),
      ]);
    } else {
      this.game.replaceScenes([new WinScene(this.game)]);
    }
  }

  private isInitialized = false;
  enter() {
    SoundManager.shared.init();
    console.log("enter", this);
    Mousetrap.bind(["n"], () => this.goToNextScene());
    Mousetrap.bind(["space"], () =>
      this.handleClick(this.ecs.player.getComponent(SpriteC).pos, Action.X)
    );
    this.game.app.ticker.add(this.gameLoop);

    this.gfx.enter();

    SoundManager.shared.playNextMusic();

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.map.updateCells((cell) => {
        this.bindCellEvents(cell, cell.bgSprite!);
      });

      this.ecs = makeECS(
        this.game,
        this.gfx.arena,
        this.map,
        this.gfx.writeMessage,
        this.n,
        this.upgrades
      );
      this.ecs.combatSystem.tilemap = this.map;
      this.gfx.updateTileSprites();
      this.ecs.engine.update(1);
      this.updateHUDText();
      this.updateHearts();
    }

    this.ecs.combatSystem.events.stream.onValue((event) => {
      this.handleCombatEvent(event);
    });

    this.gfx.dbgText.text = `Stage ${this.n + 1}`;
    this.gfx.writeMessage("Newest messages are at the top.");
    this.gfx.writeMessage("Atman enters the room.");
    if (this.upgrades.length) {
      this.gfx.writeMessage(
        `Atman's upgrades: ${this.upgrades.map((u) => u.name).join(", ")}`
      );
    }
  }

  exit() {
    console.log("exit", this);
    this.game.app.ticker.remove(this.gameLoop);
    this.gfx.exit();
    Mousetrap.unbind(["n"]);
    SoundManager.shared.stopMusic();
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
          this.isOver = true;
          this.gfx.showLoss();

          setTimeout(() => {
            this.game.replaceScenes([new MenuScene(this.game)]);
          }, 2000);
        }
        if (
          event.subject
            ?.getComponent(CombatC)
            .hasTrait(CombatTrait.KillingMeBeatsLevel)
        ) {
          this.isOver = true;
          this.gfx.showVictory();
          setTimeout(() => {
            this.goToNextScene();
          }, 2000);
        }
        break;
      case CombatEventType.AllEnemiesDead:
        this.isOver = true;
        this.gfx.showVictory();

        setTimeout(() => {
          this.goToNextScene();
        }, 2000);
        break;
      case CombatEventType.BlockedPunch:
        SoundManager.shared.play("blocked_punch");
        break;
      case CombatEventType.Counter:
        SoundManager.shared.play("counter");
        break;
      case CombatEventType.Punch:
        if (event.object === this.ecs.player) {
          SoundManager.shared.play("bm_punched");
        } else {
          SoundManager.shared.play("punch");
        }
        break;
      case CombatEventType.Stun:
        SoundManager.shared.play("stun");
        break;
      case CombatEventType.Shoot:
        SoundManager.shared.play("shoot");
        break;
      case CombatEventType.Superpunch:
        SoundManager.shared.play("superpunch");
        break;
      case CombatEventType.MissedPunch:
        SoundManager.shared.play("miss");
        break;
      default:
        throw new UnreachableCaseError(event.type);
    }
  }

  updateHoverCell(pos: AbstractVector | null) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    this.updateHUDText();

    this.gfx.showHideHoverSprite(
      pos,
      this.possibleMoves.filter(([m, r]) => r.success).length > 0
    );

    if (pos) {
      this.gfx.updateHoveredEntity(
        this.ecs.spriteSystem.findCombatEntity(pos) ||
          this.ecs.spriteSystem.findInterestingObject(pos) ||
          null
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

    const checkMove = (m: Move, p: AbstractVector) => {
      const result = m.check({ ecs: this.ecs, entity: this.ecs.player }, p);
      if (m.log) {
        console.log(m, result);
      }
      return result;
    };

    this.possibleMoves = this.ecs.player
      .getComponent(CombatC)
      .moves.map((m) => [m, checkMove(m, this.hoveredPos!)]);

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
    this.gfx.showPossibleMoves(okMoves.map((m) => m[0]));
    const atarangMove = this.ecs.player
      .getComponent(CombatC)
      .moves.find((m) => m.name === "Throw Atarang") as Atarangs;
    let statusText = `Stage ${this.n + 1}`;
    for (const m of this.ecs.player.getComponent(CombatC).moves) {
      if (!m.getStatusText) continue;
      const moveText = m.getStatusText();
      if (moveText) {
        statusText += `    ${moveText}`;
      }
    }
    this.gfx.dbgText.text = statusText;
  }

  updateHearts() {
    const combatC = this.ecs.player.getComponent(CombatC);
    this.gfx.updateHearts(combatC.hp);
    this.gfx.heartsContainer.position.set(
      this.gfx.messageLogBg.x -
        (this.gfx.heartSprites[0].width * combatC.hpMax) / 2 -
        10,
      10
    );
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

  handleClick(pos: AbstractVector, action: Action) {
    if (this.isOver) return;
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
