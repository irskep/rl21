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
import { Vector } from "vector2d";
import { EnvIndices } from "./assets";
import { Cell, Tilemap } from "./tilemap";
import { makeECS } from "./ecs/ecs";
import { CombatC } from "./ecs/combat";
import { ECS } from "./ecs/ecsTypes";
import { GameScene, GameInterface } from "./types";
import { Move, MoveCheckResult } from "./ecs/moves/_types";
import { Action, interpretEvent } from "./input";
import { Entity } from "@nova-engine/ecs";
import { SpriteC } from "./ecs/sprite";

export class LevelScene implements GameScene {
  /* pixi stuff */
  container = new Container();

  tilemapContainer = new Container();
  arena = new Container();
  overlayContainer = new Container();
  hudContainer = new Container();

  hoverSprite = new Sprite();
  dbgText = new Text("");
  messageLog = new Text("");
  messages = new Array<string>();

  mouseoverContainer = new Container();
  mouseoverBg = new Graphics();
  mouseoverText = new Text("");

  /* state management */

  ecs!: ECS;
  map = new Tilemap(new Vector(10, 10));
  possibleMoves: [Move, MoveCheckResult][] = [];

  // display
  hoveredPos: Vector | null = null;
  hoveredEntity: Entity | null = null;

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
    this.writeMessage("Atman enters the room.");
  }

  addChildren() {
    this.container.addChild(this.tilemapContainer);
    this.container.addChild(this.arena);
    this.container.addChild(this.overlayContainer);
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

    this.dbgText.position.set(10, 10);
    this.dbgText.style = new TextStyle(consoleStyle);
    this.hudContainer.addChild(this.dbgText);

    this.messageLog.anchor.set(1, 0);
    this.messageLog.position.set(this.game.app.screen.width - 10, 10);
    this.messageLog.style = new TextStyle({
      ...consoleStyle,
      align: "right",
      wordWrapWidth: 400,
    });
    this.hudContainer.addChild(this.messageLog);

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

    this.ecs = makeECS(this.game, this.arena, this.map, this.writeMessage);
    this.ecs.combatSystem.tilemap = this.map;
    this.ecs.engine.update(1);
    this.updateDbgText();
  }

  bindEvents(cell: Cell, cellSprite: Sprite) {
    (cellSprite as any).on("mouseover", (e: InteractionEvent) => {
      if (this.ecs.combatSystem.isProcessing) return;
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

  updateHoverCell(pos: Vector | null) {
    this.hoveredPos = pos;
    this.updatePossibleMoves();
    this.updateDbgText();

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

    const size = new Vector(
      this.mouseoverText.width,
      this.mouseoverText.height
    );

    const gfx = this.mouseoverBg;

    gfx.clear();
    gfx.width = size.x;
    gfx.height = size.y;
    gfx.beginFill(0x000000);
    gfx.drawRect(0, 0, size.x, size.y);
    gfx.endFill();

    console.log(this.mouseoverContainer);
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

  updateDbgText() {
    const okMoves = this.possibleMoves.filter((x) => x[1].success);
    const notOkMoves = this.possibleMoves.filter((x) => !x[1].success);
    this.dbgText.text =
      `${this.hoveredPos || "(no selection)"}\n` +
      okMoves
        .map(([move]) => `${move.action} ${move.name} (${move.help})`)
        .join("\n") +
      "\n\nOmitted:\n" +
      notOkMoves
        .map(([move, result]) => `${move.name} (${result.message || "?"})`)
        .join("\n");
  }

  writeMessage = (msg: string) => {
    this.messages.push(msg);
    while (this.messages.length > 10) {
      this.messages.shift();
    }
    this.messageLog.text = this.messages.join("\n");
  };

  gameLoop = (dt: number) => {
    /* hi */
  };

  tick() {
    this.ecs.engine.update(1);
  }

  handleClick(pos: Vector, action: Action) {
    console.log("Click", pos, action);
    const actionMoves = this.possibleMoves.filter(
      ([move, result]) => result.success && move.action == action
    );
    if (actionMoves.length > 1) {
      console.log(actionMoves);
      throw new Error(`Conflicting moves: ${actionMoves}`);
    }
    if (actionMoves.length === 1) {
      this.ecs.combatSystem.reset(this.ecs.engine);
      this.ecs.combatSystem.isProcessing = true;
      const doNext = () => {
        this.tick();
        this.updateHoverCell(this.hoveredPos);
      };

      console.log("Player move:", actionMoves[0][0]);
      const isAsync = actionMoves[0][0].apply(
        { ecs: this.ecs, entity: this.ecs.player },
        pos,
        doNext
      );
      if (!isAsync) doNext();
    }
  }
}
