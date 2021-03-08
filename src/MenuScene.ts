import Mousetrap from "mousetrap";
import * as PIXI from "pixi.js";
import { GameScene, GameInterface } from "./types";
export class MenuScene implements GameScene {
  container = new PIXI.Container();

  constructor(private game: GameInterface) {
    this.container.interactive = true;
  }

  enter() {
    console.log("enter", this);
    Mousetrap.bind(["enter", "space"], this.handleKeyPress);
    this.game.app.ticker.add(this.gameLoop);

    if (!this.container.children.length) {
      const title = new PIXI.Text("vigil@nte");
      title.style = new PIXI.TextStyle({
        fontSize: this.game.app.screen.width / 10,
        fontFamily: "Barlow Condensed",
        fill: "white",
        align: "center",
      });
      title.anchor.x = 0.5;
      title.anchor.y = 0.5;
      title.position.set(
        this.game.app.screen.width / 2,
        this.game.app.screen.height / 4
      );
      this.container.addChild(title);

      const instructions = new PIXI.Text("Press space to start");
      instructions.style = new PIXI.TextStyle({
        fontSize: this.game.app.screen.width / 40,
        fontFamily: "Barlow Condensed",
        fill: "white",
        align: "center",
      });
      instructions.anchor.x = 0.5;
      instructions.anchor.y = 0.5;
      instructions.position.set(
        this.game.app.screen.width / 2,
        this.game.app.screen.height * 0.66
      );
      this.container.addChild(instructions);

      instructions.interactive = true;
      title.interactive = true;
      (title as any).on("click", this.handleTouchStart);
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

  handleTouchStart = () => {
    // this.game.pushScene(new SongScene(this.app, this.game, true));
  };

  handleKeyPress = () => {
    // this.game.pushScene(new SongScene(this.app, this.game, false));
  };
}
