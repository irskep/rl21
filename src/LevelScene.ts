// import Mousetrap from "mousetrap";
import * as PIXI from "pixi.js";
import { InteractionEvent, Sprite } from "pixi.js";
import { Vector } from "vector2d";
import { EnvIndices } from "./assets";
import { ECS, makeECS, SpriteC } from "./ecs";
import { GameScene, GameInterface } from "./types";

class Cell {
  sprite?: Sprite = null;
  index: number = 0;
  pos: Vector;
  constructor(pos: Vector, index: number) {
    this.index = index;
    this.pos = pos;
  }
}

class Tilemap {
  contents: Cell[][];
  size: Vector;
  constructor(size: Vector) {
    this.size = size;
    this.contents = new Array(size.y);

    for (let y = 0; y < size.y; y++) {
      this.contents[y] = new Array(size.x);
      for (let x = 0; x < size.x; x++) {
        this.contents[y][x] = new Cell(
          new Vector(x, y),
          x === 0 || y === 0 || x === size.x - 1 || y === size.y - 1 ? 1 : 0
        );
      }
    }
  }
}

function isAdjacent(a: Vector, b: Vector): boolean {
  if (a.equals(b)) return false;
  return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
}

export class LevelScene implements GameScene {
  container = new PIXI.Container();

  tilemapContainer = new PIXI.Container();
  arena = new PIXI.Container();
  overlayContainer = new PIXI.Container();
  ecs: ECS;
  map = new Tilemap(new Vector(16, 16));

  hoverSprite = new Sprite();

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

    this.tilemapContainer.interactive = true;

    this.hoverSprite.texture = this.game.assets.env[EnvIndices.HOVER];
    this.hoverSprite.visible = false;
    this.overlayContainer.addChild(this.hoverSprite);

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
    const playerPos = this.ecs.player.getComponent(SpriteC).pos;
    if (pos === null || !isAdjacent(pos, playerPos)) {
      this.hoverSprite.visible = false;
    } else {
      this.hoverSprite.visible = true;
      this.hoverSprite.position.set(
        pos.x * this.game.tileSize,
        pos.y * this.game.tileSize
      );
    }
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
    if (!isAdjacent(playerPos, pos)) return;

    this.movePlayer(pos.subtract(playerPos));
  }

  movePlayer(direction: Vector) {
    const playerSpriteC = this.ecs.player.getComponent(SpriteC);
    let didFind = false;
    for (const d2 of DIRECTIONS) {
      if (d2[0].equals(direction)) {
        playerSpriteC.orientation = d2[1];
        didFind = true;
        break;
      }
    }
    playerSpriteC.pos = playerSpriteC.pos.add(direction);
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
