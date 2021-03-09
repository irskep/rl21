// import Mousetrap from "mousetrap";
import {
  Container,
  InteractionEvent,
  Sprite,
  TextStyle,
  Text,
  ITextStyle,
  Graphics,
} from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { Cell, Tilemap } from "./tilemap";
import { makeECS } from "../ecs/ecs";
import { CombatC } from "../ecs/CombatC";
import { ECS } from "../ecs/ecsTypes";
import { GameScene, GameInterface } from "../types";
import { Move, MoveCheckResult } from "../ecs/moves/_types";
import { Action, getActionText, interpretEvent } from "./input";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "../ecs/sprite";
import { CombatEvent, CombatEventType } from "../ecs/CombatS";
import {
  AnimationHandler,
  makeDriftAndFadeAnimation,
} from "./AnimationHandler";

export class LevelScene implements GameScene {
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

  /* state management */

  ecs!: ECS;
  map = new Tilemap(new Vector(10, 10));
  possibleMoves: [Move, MoveCheckResult][] = [];
  animationHandler = new AnimationHandler();

  // display
  hoveredPos: Vector | null = null;
  hoveredPosDuringUpdate: Vector | null = null;
  hoveredEntity: Entity | null = null;

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
    // Mousetrap.bind(["enter", "space"], this.handleKeyPress);
    this.game.app.ticker.add(this.gameLoop);

    if (!this.container.children.length) {
      this.addChildren();
    }

    this.game.app.stage.addChild(this.container);

    this.ecs.combatSystem.events.stream.onValue((event) => {
      this.handleCombatEvent(event);
    });

    this.writeMessage("Atman enters the room.");
  }

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

    this.hoverSprite.texture = this.game.assets.env[EnvIndices.HOVER];
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
        cellSprite.texture = this.game.assets.env[cell.index];
        cellSprite.position.set(x * this.game.tileSize, y * this.game.tileSize);
        cellSprite.interactive = true;
        this.bindEvents(cell, cellSprite);
        cell.sprite = cellSprite;
        this.tilemapContainer.addChild(cellSprite);
      }
    }

    this.layoutScreenElements();

    this.ecs = makeECS(this.game, this.arena, this.map, this.writeMessage);
    this.ecs.combatSystem.tilemap = this.map;
    this.ecs.engine.update(1);
    this.updateHUDText();
    this.updateHearts();
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
      this.screenSize.y - 60
    );
    this.messageLogBg.endFill();

    this.messageLog.style.wordWrapWidth =
      this.screenSize.x - this.gameAreaContainer.width - 10;

    this.heartsContainer.position.set(this.messageLogBg.x - 150, 10);
  }

  bindEvents(cell: Cell, cellSprite: Sprite) {
    (cellSprite as any).on("mouseover", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) {
        this.hoveredPosDuringUpdate = cell.pos;
        return;
      }
      this.updateHoverCell(cell.pos);
    });

    (cellSprite as any).on("click", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) return;
      const action = interpretEvent(e);
      if (!action) return;
      this.handleClick(cell.pos, action);
    });

    (cellSprite as any).on("rightclick", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) return;
      const action = interpretEvent(e);
      if (!action) return;
      this.handleClick(cell.pos, action);
    });
  }

  exit() {
    console.log("exit", this);
    // Mousetrap.unbind(["enter", "space"]);
    this.game.app.ticker.remove(this.gameLoop);
    this.game.app.stage.removeChild(this.container);
  }

  handleCombatEvent(event: CombatEvent) {
    console.log(event);
    switch (event.type) {
      case CombatEventType.HPChanged:
        if (event.subject === this.ecs.player) {
          this.updateHearts();
        }
        const text = new Text(`${event.value}`, {
          fontSize: 48,
          fontFamily: "Barlow Condensed",
          fill: "#ff6666",
        });
        const sourceSprite = event.subject!.getComponent(SpriteC);
        text.position.set(
          sourceSprite.sprite!.position.x,
          sourceSprite.sprite!.position.y
        );
        sourceSprite.sprite!.parent.addChild(text);
        this.animationHandler.add(
          makeDriftAndFadeAnimation(text, 100, new Vector(-1.5, -1.5))
        );
        break;
      case CombatEventType.Die:
        if (event.subject === this.ecs.player) {
          this.game.replaceScenes([new LevelScene(this.game)]);
        }
        break;
    }
  }

  updateHoverCell(pos: Vector | null) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    this.updateHUDText();

    if (this.possibleMoves.filter(([m, r]) => r.success).length > 0) {
      this.hoverSprite.visible = true;
      this.hoverSprite.position.set(
        this.hoveredPos!.x * this.game.tileSize,
        this.hoveredPos!.y * this.game.tileSize
      );
    } else {
      this.hoverSprite.visible = false;
    }

    if (pos) {
      this.updateHoveredEntity(this.ecs.spriteSystem.findEntity(pos) || null);
    } else {
      this.updateHoveredEntity(null);
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

  updatePossibleMoves() {
    if (!this.hoveredPos) {
      this.possibleMoves = this.ecs.player
        .getComponent(CombatC)
        .moves.map((m) => [m, { success: false }]);
      return;
    }

    this.possibleMoves = this.ecs.player
      .getComponent(CombatC)
      .moves.map((m) => [
        m,
        m.check({ ecs: this.ecs, entity: this.ecs.player }, this.hoveredPos!),
      ]);

    this.possibleMoves.sort(([moveA, resultA], [moveB, resultB]) => {
      if (resultA.success == resultB.success) {
        return moveA.name.localeCompare(moveB.name);
      } else if (resultA.success) {
        return -1;
      } else {
        return 1;
      }
    });
  }

  updateHUDText() {
    const okMoves = this.possibleMoves.filter((x) => x[1].success);
    const notOkMoves = this.possibleMoves.filter((x) => !x[1].success);
    this.dbgText.text = `${this.hoveredPos || "(no selection)"}\n`;
    let firstLine = okMoves
      .map(([move]) => `${move.name} (${getActionText(move.action!)})`) // (${move.help})`)
      .join("; ");
    if (okMoves.length === 0) {
      firstLine = "No moves available at selected position";
    }

    const secondLine =
      "Omitted: " +
      notOkMoves
        .map(([move, result]) => `${move.name} (${result.message || "?"})`)
        .join("; ");

    this.inputHintText.text = firstLine + "\n\n" + secondLine;
  }

  updateHearts() {
    const combatC = this.ecs.player.getComponent(CombatC);
    const halfHP = combatC.hp / 2;
    for (const sprite of this.heartSprites) {
      sprite.visible = false;
    }
    for (let i = 0; i < Math.ceil(halfHP); i++) {
      let sprite: Sprite;
      if (i >= this.heartSprites.length) {
        sprite = new Sprite(this.game.assets["heart"]![0]);
        sprite.position.set(i * 21, 0);
        this.heartSprites.push(sprite);
        this.heartsContainer.addChild(sprite);
      } else {
        sprite = this.heartSprites[i];
      }
      sprite.visible = true;

      if (i + 1 == Math.ceil(halfHP)) {
        sprite.texture = this.game.assets["heart"]![halfHP % 1 === 0 ? 0 : 1];
      }
    }
  }

  writeMessage = (msg: string) => {
    this.messages.push(msg);
    while (this.messages.length > 10) {
      this.messages.shift();
    }
    this.messageLog.text = this.messages.join("\n");
  };

  gameLoop = (dt: number) => {
    this.animationHandler.tick(dt);
  };

  tick = () => {
    this.ecs.combatSystem.onProcessingFinished = () => {
      console.log("Finished with", this.hoveredPosDuringUpdate);
      this.updateHoverCell(this.hoveredPosDuringUpdate);
      this.updateHearts();
    };
    this.ecs.engine.update(1);
  };

  handleClick(pos: Vector, action: Action) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    const actionMoves = this.possibleMoves.filter(
      ([move, result]) => result.success && move.action == action
    );
    if (actionMoves.length > 1) {
      console.log(actionMoves);
      throw new Error(`Conflicting moves: ${actionMoves}`);
    }
    this.hoveredPosDuringUpdate = this.hoveredPos;
    if (actionMoves.length === 1) {
      this.updateHoverCell(null);
      this.ecs.combatSystem.reset(this.ecs.engine);
      this.ecs.combatSystem.isProcessing = true;

      console.log("Player move:", actionMoves[0][0]);
      const isAsync = actionMoves[0][0].apply(
        { ecs: this.ecs, entity: this.ecs.player },
        pos,
        this.tick
      );
      if (!isAsync) this.tick();
    }
  }
}
