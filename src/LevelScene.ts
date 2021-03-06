import Mousetrap from "mousetrap";
import * as PIXI from "pixi.js";
import filmstrip from "./filmstrip";
import { GameScene, GameInterface } from "./types";

export class LevelScene implements GameScene {
  container = new PIXI.Container();

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
    const texture = (this.game.app.loader.resources["sprites"] as any)
      ?.texture as PIXI.Texture;
    console.log(texture);
    const textures = filmstrip(texture, 128, 128);
    console.log(textures);
    const sprite = new PIXI.Sprite(textures[0]);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(
      this.game.app.screen.width / 2,
      this.game.app.screen.height / 2
    );
    this.container.addChild(sprite);
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
