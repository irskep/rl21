// import Mousetrap from "mousetrap";
import { Container, InteractionEvent, Sprite, TextStyle, Text } from "pixi.js";
import { Vector } from "vector2d";
import { EnvIndices } from "./assets";
import { Tilemap } from "./tilemap";
import { ECS, makeECS } from "./ecs/ecs";
import { GameScene, GameInterface } from "./types";
import { ALL_MOVES, Move, MoveCheckResult } from "./ecs/moveEngine";
import { Action, interpretEvent } from "./input";

export class LevelScene implements GameScene {
  /* pixi stuff */
  container = new Container();

  tilemapContainer = new Container();
  arena = new Container();
  overlayContainer = new Container();
  hudContainer = new Container();

  hoverSprite = new Sprite();
  dbgText = new Text("");

  /* state management */

  ecs: ECS;
  map = new Tilemap(new Vector(16, 16));
  possibleMoves: [Move, MoveCheckResult][] = [];

  // debug state
  hoveredPos: Vector | null = null;

  constructor(private game: GameInterface) {
    this.container.interactive = true;
  }

  enter() {
    console.log("enter", this);
    // Mousetrap.bind(["enter", "space"], this.handleKeyPress);
    this.game.app.ticker.add(this.gameLoop);

    if (!this.container.children.length) {
      this.addChildren();
    }

    this.game.app.stage.addChild(this.container);
  }

  addChildren() {
    this.container.addChild(this.tilemapContainer);
    this.container.addChild(this.arena);
    this.container.addChild(this.overlayContainer);
    this.container.addChild(this.hudContainer);

    this.tilemapContainer.interactive = true;

    this.tilemapContainer.setTransform(undefined, undefined, 0.5, 0.5);
    this.arena.setTransform(undefined, undefined, 0.5, 0.5);
    this.overlayContainer.setTransform(undefined, undefined, 0.5, 0.5);

    this.hoverSprite.texture = this.game.assets.env[EnvIndices.HOVER];
    this.hoverSprite.visible = false;
    this.overlayContainer.addChild(this.hoverSprite);

    this.dbgText.position.set(10, 10);
    this.dbgText.style = new TextStyle({
      fontSize: 18,
      fontFamily: "Barlow Condensed",
      fill: "white",
      align: "left",
      wordWrap: true,
      wordWrapWidth: 320,
    });
    this.hudContainer.addChild(this.dbgText);

    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cellSprite = new Sprite();
        const cell = this.map.contents[y][x];
        cellSprite.texture = this.game.assets.env[cell.index];
        cellSprite.position.set(x * this.game.tileSize, y * this.game.tileSize);
        cellSprite.interactive = true;
        cellSprite.on("mouseover", (e: InteractionEvent) => {
          this.updateHoverCell(cell.pos);
        });
        cellSprite.on("click", (e: InteractionEvent) => {
          const action = interpretEvent(e);
          if (!action) return;
          this.handleClick(cell.pos, action);
        });
        cell.sprite = cellSprite;
        this.tilemapContainer.addChild(cellSprite);
      }
    }

    this.ecs = makeECS(this.game, this.arena);
    this.ecs.engine.update(1);
  }

  exit() {
    console.log("exit", this);
    // Mousetrap.unbind(["enter", "space"]);
    this.game.app.ticker.remove(this.gameLoop);
    this.game.app.stage.removeChild(this.container);
  }

  updateHoverCell(pos: Vector | null) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    this.updateDbgText();

    if (this.possibleMoves.filter(([m, r]) => r.success).length > 0) {
      this.hoverSprite.visible = true;
      this.hoverSprite.position.set(
        this.hoveredPos.x * this.game.tileSize,
        this.hoveredPos.y * this.game.tileSize
      );
    } else {
      this.hoverSprite.visible = false;
    }
  }

  updatePossibleMoves() {
    this.possibleMoves = ALL_MOVES.map((m) => [
      m,
      m.check(
        { ecs: this.ecs, entity: this.ecs.player, tilemap: this.map },
        this.hoveredPos
      ),
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

  updateDbgText() {
    const okMoves = this.possibleMoves.filter((x) => x[1].success);
    const notOkMoves = this.possibleMoves.filter((x) => !x[1].success);
    this.dbgText.text =
      `${this.hoveredPos}\n` +
      okMoves
        .map(([move]) => `${move.action} ${move.name} (${move.help})`)
        .join("\n") +
      "\n\nOmitted:\n" +
      notOkMoves
        .map(([move, result]) => `${move.name} (${result.message || "?"})`)
        .join("\n");
  }

  gameLoop = (dt: number) => {
    /* hi */
  };

  tick() {
    this.ecs.engine.update(1);
  }

  handleClick(pos: Vector, action: Action) {
    const actionMoves = this.possibleMoves.filter(
      ([move, result]) => result.success && move.action == action
    );
    if (actionMoves.length > 1) {
      console.log(actionMoves);
      throw new Error(`Conflicting moves: ${actionMoves}`);
    }
    if (actionMoves.length === 1) {
      actionMoves[0][0].apply(
        { ecs: this.ecs, entity: this.ecs.player, tilemap: this.map },
        pos
      );
      this.tick();
    }
  }
}
