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
import { CellTag, Tilemap } from "./tilemap";
import { CombatC } from "../ecs/combat/CombatC";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/SpriteC";
import {
  AnimationManager,
  makeDriftAndFadeAnimation,
} from "./AnimationManager";
import { GameInterface, TILE_SIZE } from "../types";
import { Move } from "../ecs/moves/_types";
import { Action } from "./input";
import RNG from "./RNG";
import { Upgrade } from "../ecs/upgrades";

const consoleStyle: Partial<ITextStyle> = {
  fontSize: 18,
  fontFamily: "Barlow Condensed",
  fill: "white",
  align: "left",
  wordWrap: true,
  wordWrapWidth: 320,
};

const METRICS = {
  topbarHeight: 30,
  sidebarWidth: 320,
  inputHintHeight: 178,
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
  inputHintBg = new Graphics();
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
  animationManager = new AnimationManager();

  constructor(
    private game: GameInterface,
    private map: Tilemap,
    private upgrades: Upgrade[]
  ) {
    this.app = game.app;
    this.container.interactive = true;
  }

  get screenSize(): AbstractVector {
    return new Vector(this.app.screen.width, this.app.screen.height);
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
    this.animationManager.tick(dt);
  };

  addChildren() {
    this.container.addChild(this.gameAreaContainer);
    this.gameAreaContainer.addChild(this.tilemapContainer);
    this.gameAreaContainer.addChild(this.arena);
    this.gameAreaContainer.addChild(this.overlayContainer);
    this.container.addChild(this.hudContainer);

    this.tilemapContainer.interactive = true;
    this.tilemapContainer.sortableChildren = true;

    this.hoverSprite.texture = this.game.images["hover"];
    this.hoverSprite.visible = false;
    this.overlayContainer.addChild(this.hoverSprite);

    this.dbgText.style = new TextStyle({ ...consoleStyle, wordWrap: false });
    this.hudContainer.addChild(this.dbgText);

    this.inputHintText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.inputHintBg);
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
        const cell = this.map.contents[y][x];
        cell.bgSprite = new Sprite(this.game.filmstrips.env[0]);
        cell.fgSprite = new Sprite(this.game.filmstrips.env[0]);
        cell.fgSprite.visible = false;
        cell.bgSprite.position.set(
          x * cell.bgSprite.width,
          y * cell.bgSprite.height
        );
        cell.fgSprite.position.set(
          x * cell.fgSprite.width,
          y * cell.fgSprite.height
        );
        cell.bgSprite.interactive = true;
        this.tilemapContainer.addChild(cell.bgSprite);
        this.tilemapContainer.addChild(cell.fgSprite);
      }
    }

    this.updateTileSprites();
    this.layoutScreenElements();
  }

  private layoutScreenElements() {
    /* set up whole-screen layout */

    // game area
    // const gameAreaMask = new Graphics();
    // gameAreaMask.beginFill(0xffffff);
    // gameAreaMask.drawRect(0, 0, this.screenSize.x - METRICS.sidebarWidth, this.screenSize.y);
    // gameAreaMask.endFill();
    // this.gameAreaContainer.mask = gameAreaMask;
    const availableGameSpace = new Vector(
      this.game.app.screen.width - METRICS.sidebarWidth,
      this.game.app.screen.height - METRICS.topbarHeight
    );
    const mapWidth = TILE_SIZE * this.map.size.x;
    const scale = availableGameSpace.x / mapWidth;
    console.log(scale);

    this.gameAreaContainer;
    this.gameAreaContainer.setTransform(0, METRICS.topbarHeight, scale, scale);

    const sidebarX = this.screenSize.x - METRICS.sidebarWidth;

    // debug text
    this.dbgText.position.set(10, 8);

    // input area

    this.inputHintText.position.set(sidebarX + 10, 10);
    this.inputHintText.anchor.set(0, 0);
    this.inputHintText.style.wordWrapWidth = METRICS.sidebarWidth - 20;
    this.possibleActionsContainer.position.set(sidebarX + 10, 40);

    this.inputHintBg.position.set(sidebarX, 0);
    this.inputHintBg.beginFill(0x444477);
    this.inputHintBg.drawRect(0, 0, 320, METRICS.inputHintHeight);
    this.inputHintBg.endFill();

    // message log
    this.messageLogBg.position.set(sidebarX, 178);
    const messageLogHeight = this.screenSize.y - this.messageLogBg.position.y;
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

    this.heartsContainer.position.set(this.messageLogBg.x - 150, 7);
  }

  rng = new RNG(`${Date.now()}`);

  updateTileSprites() {
    const floorTexture = (pos: AbstractVector): Texture => {
      return this.game.filmstrips.env[pos.y * 20 + pos.x];
    };

    const wallTexture = (pos: AbstractVector): Texture => {
      let x = 0;
      let y = 0;

      x = 2;
      y = 4;

      const index = this.rng.choice([
        20 * 1 + 10 + 0,
        20 * 1 + 10 + 2,
        20 * 1 + 10 + 4,
      ]);
      return this.game.filmstrips.walls[this.rng.choice([0, 1])];
    };

    const pitTexture = (pos: AbstractVector): Texture => {
      let x = 0;
      let y = 0;

      x = 2;
      y = 4;

      const index = this.rng.choice([
        20 * 0 + 10 + 8,
        20 * 1 + 10 + 0,
        20 * 1 + 10 + 6,
        20 * 1 + 10 + 7,
        20 * 1 + 10 + 8,
        20 * 1 + 10 + 9,
      ]);
      return this.game.filmstrips.env[index];
    };

    for (let y = 0; y < this.map.size.y; y++) {
      for (let x = 0; x < this.map.size.x; x++) {
        const cell = this.map.contents[y][x];

        cell.bgSprite!.zIndex = -1;
        cell.bgSprite!.texture = floorTexture(cell.pos);

        switch (cell.tag) {
          case CellTag.Floor:
            cell.fgSprite!.visible = false;
            break;
          case CellTag.Wall:
            cell.fgSprite!.texture = wallTexture(cell.pos);
            cell.fgSprite!.visible = true;
            break;
          case CellTag.Pit:
            cell.fgSprite!.texture = pitTexture(cell.pos);
            cell.fgSprite!.visible = true;
            break;
          case CellTag.Door:
            cell.fgSprite!.texture = this.game.filmstrips.env[20 * 1 + 10 + 5];
            cell.fgSprite!.visible = true;
            break;
        }
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
    const scale = this.gameAreaContainer.scale;
    const pos = new Vector(
      (tilePos.x + 1) * TILE_SIZE * scale.x + 10,
      tilePos.y * TILE_SIZE * scale.y
    );
    if (tilePos.x > 5) {
      pos.x -= size.x + TILE_SIZE * 1.5 * scale.x + 20;
    } else {
      pos.x += TILE_SIZE * 0.5 * scale.x;
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

  showHideHoverSprite(pos: AbstractVector | null, shouldShow: boolean) {
    if (pos && shouldShow) {
      this.hoverSprite.visible = true;
      this.hoverSprite.position.set(pos.x * TILE_SIZE, pos.y * TILE_SIZE);
    } else {
      this.hoverSprite.visible = false;
    }
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
      if (this.upgrades.length) {
        this.inputHintText.text += `\n\nAtman's upgrades: ${this.upgrades
          .map((u) => u.name)
          .join(", ")}`;
      }
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

  showFloatingImage(
    sourceSprite: Sprite,
    image: string,
    offset: AbstractVector = new Vector(0, -10)
  ) {
    const sprite = new Sprite(this.game.images[image]);
    sprite.anchor.set(0.5, 0.5);
    sprite.setTransform(
      sourceSprite.position.x + offset.x,
      sourceSprite.position.y + offset.y,
      0.15,
      0.15
    );
    sourceSprite.parent.addChild(sprite);
    this.animationManager.add(
      makeDriftAndFadeAnimation(sprite, 1, new Vector(0, 0))
    );
  }

  showFloatingText(sourceSprite: Sprite, textValue: string, fill: string) {
    const text = new Text(textValue, {
      fontSize: 48,
      fontFamily: "Barlow Condensed",
      fill: fill,
    });
    text.position.set(sourceSprite.position.x, sourceSprite.position.y);
    sourceSprite.parent.addChild(text);
    this.animationManager.add(
      makeDriftAndFadeAnimation(text, 3, new Vector(-100, -100))
    );
  }
}
