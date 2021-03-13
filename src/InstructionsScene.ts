import Mousetrap from "mousetrap";
import { Container, Sprite } from "pixi.js";
import { LevelScene } from "./game/LevelScene";
import { SoundManager } from "./SoundManager";
import { GameScene, GameInterface } from "./types";

export class InstructionsScene implements GameScene {
  container = new Container();
  sprite: Sprite;

  constructor(private game: GameInterface) {
    this.container.interactive = true;
    this.sprite = new Sprite(game.images.instructions);
  }

  enter() {
    console.log("enter", this);
    Mousetrap.bind(["enter", "space"], this.go);
    this.game.app.ticker.add(this.gameLoop);

    if (!this.container.children.length) {
      this.sprite.position.set(
        this.game.app.screen.width / 2,
        this.game.app.screen.height / 2
      );
      this.sprite.anchor.set(0.5, 0.5);
      this.sprite.interactive = true;
      this.container.addChild(this.sprite);
      this.sprite.on("click", this.go);
    }

    this.game.app.stage.addChild(this.container);
  }

  exit() {
    console.log("exit", this);
    Mousetrap.unbind(["enter", "space"]);
    this.game.app.ticker.remove(this.gameLoop);
    this.game.app.stage.removeChild(this.container);
  }

  gameLoop = (dt: number) => {
    /* hi */
  };

  go = () => {
    SoundManager.shared.init();
    this.game.replaceScenes([new LevelScene(this.game, 0, [])]);
  };
}
