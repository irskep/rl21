import { Container, TextStyle, Text, Graphics } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { MenuScene } from "./MenuScene";
import { GameScene, GameInterface } from "./types";

export class WinScene implements GameScene {
  container = new Container();

  constructor(private game: GameInterface) {
    this.container.interactive = true;
  }

  get screenSize(): AbstractVector {
    let width = this.game.app.screen.width;
    let height = width * (3 / 4);
    if (height > this.game.app.screen.height) {
      height = this.game.app.screen.height;
      width = height * (4 / 3);
    }
    return new Vector(width, height);
  }

  enter() {
    console.log("enter", this);
    this.game.app.ticker.add(this.gameLoop);

    const title = new Text("You win!");
    title.style = new TextStyle({
      fontSize: (this.screenSize.x / 20) * 2,
      fontFamily: "Barlow Condensed",
      fill: "white",
      align: "center",
    });
    title.anchor.x = 0.5;
    title.anchor.y = 1;
    title.position.set(this.screenSize.x / 2, this.screenSize.y / 6);
    this.container.addChild(title);

    this.game.app.stage.addChild(this.container);

    setTimeout(() => {
      this.game.replaceScenes([new MenuScene(this.game)]);
    }, 3000);
  }

  exit() {
    console.log("exit", this);
    this.game.app.ticker.remove(this.gameLoop);
    this.game.app.stage.removeChild(this.container);
  }

  gameLoop = (dt: number) => {
    /* hi */
  };
}
