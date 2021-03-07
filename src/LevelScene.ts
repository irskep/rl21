// import Mousetrap from "mousetrap";
import { Container, InteractionEvent, Sprite, TextStyle, Text } from "pixi.js";
import { Vector } from "vector2d";
import { EnvIndices } from "./assets";
import { Tilemap, isAdjacent } from "./tilemap";
import { ECS, makeECS } from "./ecs/ecs";
import { SpriteC } from "./ecs/sprite";
import { GameScene, GameInterface } from "./types";
import { ALL_MOVES, Move, MoveCheckResult } from "./ecs/moveEngine";

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
          this.handleClick(cell.pos);
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
    this.dbgText.text =
      `${this.hoveredPos}\n` +
      this.possibleMoves
        .map(([move, result]) => {
          if (result.success) {
            return `${move.name} (${move.help})`;
          } else {
            return `X ${move.name} (${result.message || "?"})`;
          }
        })
        .join("\n");
  }

  gameLoop = (dt: number) => {
    /* hi */
  };

  tick() {
    this.ecs.engine.update(1);
  }

  handleClick(pos: Vector) {
    const playerSpriteC = this.ecs.player.getComponent(SpriteC);
    const playerPos = playerSpriteC.pos;
    if (!isAdjacent(playerPos, pos)) {
      console.log("Discard", pos, playerPos);
      return;
    }

    this.movePlayer(pos);
  }

  movePlayer(pos: Vector) {
    const playerSpriteC = this.ecs.player.getComponent(SpriteC);
    // let didFind = false;
    const direction = new Vector(pos.x, pos.y).subtract(playerSpriteC.pos);
    for (const d2 of DIRECTIONS) {
      if (d2[0].equals(direction)) {
        playerSpriteC.orientation = d2[1];
        // didFind = true;
        break;
      }
    }
    playerSpriteC.pos = pos;
    this.tick();
  }
}

const DIRECTIONS: [Vector, number][] = [
  [new Vector(0, -1), 0],
  [new Vector(1, -1), 0.5],
  [new Vector(1, 0), 1],
  [new Vector(1, 1), 1.5],
  [new Vector(0, 1), 2],
  [new Vector(-1, 1), 2.5],
  [new Vector(-1, 0), 3],
  [new Vector(-1, -1), 3.5],
];
