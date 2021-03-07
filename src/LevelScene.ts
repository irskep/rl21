// import Mousetrap from "mousetrap";
import * as PIXI from "pixi.js";
import { Sprite } from "pixi.js";
import { Vector } from "vector2d";
import { ECS, makeECS } from "./ecs";
import { GameScene, GameInterface } from "./types";

class Cell {
  sprite?: Sprite = null;
  index: number = 0;
  constructor(index: number) {
    this.index = index;
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
          x === 0 || y === 0 || x === size.x - 1 || y === size.y - 1 ? 1 : 0
        );
      }
    }
  }
}

export class LevelScene implements GameScene {
  container = new PIXI.Container();
  tilemapContainer = new PIXI.Container();
  arena = new PIXI.Container();
  ecs: ECS;
  map = new Tilemap(new Vector(16, 16));

  constructor(private game: GameInterface) {
    this.container.interactive = true;
    console.log(this.map);
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

    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cellSprite = new Sprite();
        const cell = this.map.contents[y][x];
        cellSprite.texture = this.game.assets.env[cell.index];
        cellSprite.position.set(x * this.game.tileSize, y * this.game.tileSize);
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

  gameLoop = (dt: number) => {
    /* hi */
  };

  handleTouchStart = () => {
    // this.game.pushScene(new SongScene(this.app, this.game, true));
  };

  handleKeyPress = () => {
    // this.game.pushScene(new SongScene(this.app, this.game, false));
  };
}
