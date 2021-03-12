import { Container, TextStyle, Text, Graphics } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { makeUpgradePool, Upgrade } from "./ecs/upgrades";
import { LevelScene } from "./game/LevelScene";
import RNG from "./game/RNG";
import { GameScene, GameInterface } from "./types";

const margin = 20;

class UpgradeCard {
  container = new Container();
  backgroundGfx = new Graphics();
  titleLabel = new Text("Lorem Ipsum", {
    fontSize: 24,
    fontFamily: "Barlow Condensed",
    fill: "white",
    align: "center",
  });

  descriptionLabel = new Text("Lorem Ipsum", {
    fontSize: 18,
    fontFamily: "Barlow Condensed",
    fill: "white",
    align: "left",
    wordWrap: true,
    wordWrapWidth: 320 - margin * 2,
  });

  size = new Vector(320, 240);

  constructor(title: string, description: string, onClick: () => void) {
    this.container.addChild(this.backgroundGfx);
    this.container.addChild(this.titleLabel);
    this.container.addChild(this.descriptionLabel);

    this.titleLabel.position.set(this.size.x / 2, margin);
    this.titleLabel.anchor.set(0.5, 0);
    this.descriptionLabel.position.set(margin, 40 + margin);

    this.backgroundGfx.lineStyle({ width: 1, color: 0xffffff });
    this.backgroundGfx.beginFill(0x000000);
    this.backgroundGfx.drawRect(0, 0, this.size.x, this.size.y - 2);
    this.backgroundGfx.endFill();
    this.backgroundGfx.interactive = true;
    this.backgroundGfx.on("click", onClick);

    this.container.width = this.size.x;
    this.container.height = this.size.y;

    this.configure(title, description);
  }

  configure(title: string, description: string) {
    this.titleLabel.text = title;
    this.descriptionLabel.text = description;
  }
}

export class UpgradeScene implements GameScene {
  container = new Container();
  upgradesContainer = new Container();
  upgrades: Upgrade[];

  constructor(
    private game: GameInterface,
    private n: number,
    private usedUpgrades: Upgrade[],
    rng: RNG
  ) {
    this.container.interactive = true;

    const usedUpgradeNames = this.usedUpgrades.map((u) => u.name);

    const availableUpgrades = makeUpgradePool().filter(
      (u) => !u.exclusive || usedUpgradeNames.indexOf(u.name) === -1
    );
    rng.shuffle(availableUpgrades);
    this.upgrades = availableUpgrades.slice(0, 2);
    console.log(this.upgrades);
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

    const title = new Text("Choose an upgrade");
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

    this.container.addChild(this.upgradesContainer);

    let upgradesContainerWidth = 0;
    for (let i = 0; i < this.upgrades.length; i++) {
      const u = this.upgrades[i];
      const card = new UpgradeCard(u.name, u.description, () =>
        this.chooseUpgrade(u)
      );
      card.container.position.set(card.size.x * i + margin * i, 0);
      upgradesContainerWidth = card.container.position.x + card.size.x + margin;
      this.upgradesContainer.addChild(card.container);
    }

    this.upgradesContainer.position.set(
      this.screenSize.x / 2 - this.upgradesContainer.width / 2 - margin,
      title.position.y + 40
    );

    this.game.app.stage.addChild(this.container);
  }

  exit() {
    console.log("exit", this);
    this.game.app.ticker.remove(this.gameLoop);
    this.game.app.stage.removeChild(this.container);
  }

  chooseUpgrade(u: Upgrade) {
    this.game.replaceScenes([
      new LevelScene(this.game, this.n, this.usedUpgrades.concat([u])),
    ]);
  }

  gameLoop = (dt: number) => {
    /* hi */
  };
}
