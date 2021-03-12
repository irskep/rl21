import {
  Container,
  Sprite,
  TextStyle,
  Text,
  ITextStyle,
  Graphics,
  Application,
  Texture,
} from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { Tilemap } from "./tilemap";
import { CombatC } from "../ecs/combat/CombatC";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/SpriteC";
import {
  AnimationManager,
  makeDriftAndFadeAnimation,
} from "./AnimationManager";
import { GameInterface } from "../types";
import { Move } from "../ecs/moves/_types";
import { Action, getActionText } from "./input";

const consoleStyle: Partial<ITextStyle> = {
  fontSize: 18,
  fontFamily: "Barlow Condensed",
  fill: "white",
  align: "left",
  wordWrap: true,
  wordWrapWidth: 320,
};

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
  possibleActionsContainer = new Container();
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

    this.dbgText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.dbgText);

    this.inputHintText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.inputHintText);
    this.hudContainer.addChild(this.possibleActionsContainer);

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

    // game area
    const gameAreaMask = new Graphics();
    gameAreaMask.beginFill(0xffffff);
    gameAreaMask.drawRect(0, 0, this.screenSize.x - 320, this.screenSize.y);
    gameAreaMask.endFill();
    this.gameAreaContainer.mask = gameAreaMask;
    this.gameAreaContainer.position.set(0, 30);

    // debug text
    this.dbgText.position.set(10, 10);

    // input area
    this.inputHintText.position.set(this.gameAreaContainer.width, 10);
    this.inputHintText.anchor.set(0, 0);
    this.inputHintText.style.wordWrapWidth = 320;
    this.possibleActionsContainer.position.set(
      this.gameAreaContainer.width,
      40
    );

    // message log
    this.messageLogBg.position.set(this.gameAreaContainer.width, 178);
    const messageLogHeight =
      this.gameAreaContainer.height - this.messageLogBg.position.y;
    this.messageLog.position.set(10, 10);
    this.messageLogBg.beginFill(0x333366);
    this.messageLogBg.drawRect(0, 0, 320, messageLogHeight);
    this.messageLogBg.endFill();

    this.messageLog.style.wordWrapWidth = 320 - 20;

    const messageLogMask = new Graphics();
    messageLogMask.beginFill(0xffffff);
    messageLogMask.drawRect(
      this.messageLogBg.x,
      this.messageLogBg.y,
      320,
      messageLogHeight
    );
    messageLogMask.endFill();
    this.messageLog.mask = messageLogMask;

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

    this.mouseoverText.style.wordWrapWidth = 220;
    const size = new Vector(
      this.mouseoverText.style.wordWrapWidth + 8,
      Math.max(this.mouseoverText.height + 8, 220)
    );

    const gfx = this.mouseoverBg;

    let text = e.getComponent(SpriteC).hoverText;
    if (e.hasComponent(CombatC))
      text += `\n\n${e.getComponent(CombatC).hoverText}`;
    this.mouseoverText.text = text;
    this.mouseoverText.position.set(4, 4);

    const tilePos = e.getComponent(SpriteC).pos;
    const pos = new Vector(
      (tilePos.x + 1) * this.game.tileSize * this.arena.scale.x + 10,
      tilePos.y * this.game.tileSize * this.arena.scale.y
    );
    if (tilePos.x > 5) {
      pos.x -= size.x + this.game.tileSize * 1.5 * this.arena.scale.x + 20;
    } else {
      pos.x += this.game.tileSize * 0.5 * this.arena.scale.x;
    }
    this.mouseoverContainer.position.set(pos.x, pos.y);
    this.mouseoverContainer.visible = true;

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
    this.messages.unshift(msg);
    while (this.messages.length > 20) {
      this.messages.pop();
    }
    this.messageLog.text = this.messages.join("\n");
  };

  showPossibleMoves(moves: Move[]) {
    if (moves.length === 0) {
      this.inputHintText.text =
        "No moves available at selected position. Try moving your mouse around. Sometimes you need to click yourself.";
    } else {
      this.inputHintText.text = "Possible moves:";
    }

    this.possibleActionsContainer.removeChildren(
      0,
      this.possibleActionsContainer.children.length
    );
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      let texture!: Texture;
      switch (m.action) {
        case Action.X:
          texture = this.game.filmstrips["input"][0];
          break;
        case Action.Y:
          texture = this.game.filmstrips["input"][1];
          break;
        case Action.A:
          texture = this.game.filmstrips["input"][2];
          break;
        case Action.B:
          texture = this.game.filmstrips["input"][3];
          break;
      }
      if (!texture) throw new Error("?");
      const inputSprite = new Sprite(texture);
      inputSprite.position.set(10, i * 32);
      const moveText =
        m.name === "Wait" ? "Wait (you can also press Space)" : m.name;
      const inputText = new Text(moveText, {
        ...consoleStyle,
        wordWrap: false,
      });
      inputText.position.set(20 + texture.width, i * 32 + 16);
      inputText.anchor.set(0, 0.5);
      this.possibleActionsContainer.addChild(inputSprite);
      this.possibleActionsContainer.addChild(inputText);
    }
  }

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
