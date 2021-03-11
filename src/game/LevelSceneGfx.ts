import {
  Container,
  Sprite,
  TextStyle,
  Text,
  ITextStyle,
  Graphics,
  Application,
} from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { Tilemap } from "./tilemap";
import { CombatC } from "../ecs/combat/CombatC";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/sprite";
import {
  AnimationManager,
  makeDriftAndFadeAnimation,
} from "./AnimationManager";
import { GameInterface } from "../types";

export class LevelSceneGfx {
  /* pixi stuff */
  container = new Container();

  hudContainer = new Container();
  gameAreaContainer = new Container();
  tilemapContainer = new Container();
  arena = new Container();
  overlayContainer = new Container();

  hoverSprite = new Sprite();
  dbgText = new Text("");
  inputHintText = new Text("");
  messageLogBg = new Graphics();
  messageLog = new Text("");
  messages = new Array<string>();

  mouseoverContainer = new Container();
  mouseoverBg = new Graphics();
  mouseoverText = new Text("");

  heartsContainer = new Container();
  heartSprites: Sprite[] = [];

  app: Application;
  animationHandler = new AnimationManager();

  constructor(private game: GameInterface, private map: Tilemap) {
    this.app = game.app;
    this.container.interactive = true;
  }

  get screenSize(): AbstractVector {
    let width = this.app.screen.width;
    let height = width * (3 / 4);
    if (height > this.app.screen.height) {
      height = this.app.screen.height;
      width = height * (4 / 3);
    }
    return new Vector(width, height);
  }

  enter() {
    if (!this.container.children.length) {
      this.addChildren();
    }

    this.app.stage.addChild(this.container);
  }

  exit() {
    this.app.stage.removeChild(this.container);
  }

  tick = (dt: number) => {
    this.animationHandler.tick(dt);
  };

  addChildren() {
    this.container.addChild(this.gameAreaContainer);
    this.gameAreaContainer.addChild(this.tilemapContainer);
    this.gameAreaContainer.addChild(this.arena);
    this.gameAreaContainer.addChild(this.overlayContainer);
    this.container.addChild(this.hudContainer);

    this.tilemapContainer.interactive = true;

    this.tilemapContainer.setTransform(undefined, undefined, 0.5, 0.5);
    this.arena.setTransform(undefined, undefined, 0.5, 0.5);
    this.overlayContainer.setTransform(undefined, undefined, 0.5, 0.5);

    this.hoverSprite.texture = this.game.filmstrips.env[EnvIndices.HOVER];
    this.hoverSprite.visible = false;
    this.overlayContainer.addChild(this.hoverSprite);

    const consoleStyle: Partial<ITextStyle> = {
      fontSize: 18,
      fontFamily: "Barlow Condensed",
      fill: "white",
      align: "left",
      wordWrap: true,
      wordWrapWidth: 320,
    };

    this.dbgText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.dbgText);

    this.inputHintText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.inputHintText);

    this.hudContainer.addChild(this.heartsContainer);

    this.messageLog.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.messageLogBg);
    this.messageLogBg.addChild(this.messageLog);

    this.mouseoverText.style = new TextStyle(consoleStyle);
    this.mouseoverContainer.addChild(this.mouseoverBg);
    this.mouseoverContainer.addChild(this.mouseoverText);
    this.mouseoverContainer.visible = false;
    this.hudContainer.addChild(this.mouseoverContainer);

    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cellSprite = new Sprite();
        const cell = this.map.contents[y][x];
        cellSprite.texture = this.game.filmstrips.env[cell.index];
        cell.sprite = cellSprite;
        cellSprite.position.set(x * this.game.tileSize, y * this.game.tileSize);
        cellSprite.interactive = true;
        this.tilemapContainer.addChild(cellSprite);
      }
    }

    this.layoutScreenElements();
    this.updateTileSprites();
  }

  private layoutScreenElements() {
    /* set up whole-screen layout */
    const gameAreaMask = new Graphics();
    gameAreaMask.beginFill(0xffffff);
    gameAreaMask.drawRect(
      0,
      0,
      this.screenSize.x - 320,
      this.screenSize.y - 60
    );
    gameAreaMask.endFill();
    this.gameAreaContainer.mask = gameAreaMask;
    this.gameAreaContainer.position.set(0, 30);

    this.dbgText.position.set(10, 10);
    this.inputHintText.position.set(
      10,
      this.gameAreaContainer.position.y + this.gameAreaContainer.height
    );
    this.inputHintText.style.wordWrapWidth = this.screenSize.x;
    this.messageLogBg.position.set(this.gameAreaContainer.width, 0);
    this.messageLog.position.set(10, 10);
    this.messageLogBg.beginFill(0x333366);
    this.messageLogBg.drawRect(
      0,
      0,
      this.screenSize.x - this.gameAreaContainer.width,
      this.gameAreaContainer.height + this.gameAreaContainer.position.y
    );
    this.messageLogBg.endFill();

    this.messageLog.style.wordWrapWidth =
      this.screenSize.x - this.gameAreaContainer.width - 10;

    this.heartsContainer.position.set(this.messageLogBg.x - 150, 10);
  }

  updateTileSprites() {
    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cell = this.map.contents[y][x];
        cell.sprite!.texture = this.game.filmstrips.env[cell.index];
      }
    }
  }

  updateHoveredEntity(e: Entity | null) {
    if (!e) {
      this.mouseoverContainer.visible = false;
      return;
    }

    const tilePos = e.getComponent(SpriteC).pos;
    const pos = new Vector(
      (tilePos.x + 1) * this.game.tileSize * this.arena.scale.x + 10,
      tilePos.y * this.game.tileSize * this.arena.scale.y
    );
    this.mouseoverContainer.position.set(pos.x, pos.y);
    this.mouseoverContainer.visible = true;

    const text = `${e.getComponent(SpriteC).hoverText}\n\n${
      e.getComponent(CombatC).hoverText
    }`;
    this.mouseoverText.text = text;
    this.mouseoverText.position.set(4, 4);

    const size = new Vector(
      this.mouseoverText.width + 8,
      this.mouseoverText.height + 8
    );

    const gfx = this.mouseoverBg;

    gfx.clear();
    gfx.width = size.x;
    gfx.height = size.y;
    gfx.lineStyle({ width: 1, color: 0xffffff });
    gfx.beginFill(0x000000);
    gfx.drawRect(0, 0, size.x, size.y - 2);
    gfx.endFill();
  }

  updateHearts(hp: number) {
    const halfHP = hp / 2;
    for (const sprite of this.heartSprites) {
      sprite.visible = false;
    }
    for (let i = 0; i < Math.ceil(halfHP); i++) {
      let sprite: Sprite;
      if (i >= this.heartSprites.length) {
        sprite = new Sprite(this.game.filmstrips["heart"]![0]);
        sprite.position.set(i * 21, 0);
        this.heartSprites.push(sprite);
        this.heartsContainer.addChild(sprite);
      } else {
        sprite = this.heartSprites[i];
      }
      sprite.visible = true;

      if (i + 1 == Math.ceil(halfHP)) {
        sprite.texture = this.game.filmstrips["heart"]![
          halfHP % 1 === 0 ? 0 : 1
        ];
      }
    }
  }

  /** Stuff you can do */

  writeMessage = (msg: string) => {
    this.messages.push(msg);
    while (this.messages.length > 20) {
      this.messages.shift();
    }
    this.messageLog.text = this.messages.join("\n");
  };

  showLoss() {
    const victorySprite = new Sprite(this.game.images["youlose"]);
    victorySprite.anchor.set(0.5, 0.5);
    victorySprite.position.set(
      this.hudContainer.width / 2,
      this.hudContainer.height / 2
    );
    this.hudContainer.addChild(victorySprite);
  }

  showVictory() {
    const victorySprite = new Sprite(this.game.images["stagecomplete"]);
    victorySprite.anchor.set(0.5, 0.5);
    victorySprite.position.set(
      this.hudContainer.width / 2,
      this.hudContainer.height / 2
    );
    this.hudContainer.addChild(victorySprite);
  }

  showFloatingText(sourceSprite: Sprite, textValue: string, fill: string) {
    const text = new Text(textValue, {
      fontSize: 48,
      fontFamily: "Barlow Condensed",
      fill: fill,
    });
    text.position.set(sourceSprite.position.x, sourceSprite.position.y);
    sourceSprite.parent.addChild(text);
    this.animationHandler.add(
      makeDriftAndFadeAnimation(text, 3, new Vector(-100, -100))
    );
  }
}
