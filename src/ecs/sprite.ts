import {
  Engine,
  Component,
  System,
  FamilyBuilder,
  Family,
  Entity,
} from "@nova-engine/ecs";
import { Container, Sprite, Text } from "pixi.js";
import * as Vec2D from "vector2d";
import { Vector } from "vector2d";
import { GameInterface } from "../types";
import { DIRECTIONS } from "./direction";

export class SpriteC implements Component {
  pos = new Vec2D.Vector(0, 0);
  orientation = 0; // clockwise from up
  private _spriteIndex = 0;
  needsTextureReplacement = false;
  private _label = "";
  needsLabelUpdate = false;
  sprite?: Sprite;
  text: Text | null = null;

  name = ""; // sprites have names too, why not

  build(name: string, pos: Vec2D.Vector, spriteIndex: number): SpriteC {
    this.name = name;
    this.pos = pos;
    this.spriteIndex = spriteIndex;
    return this;
  }

  get spriteIndex(): number {
    return this._spriteIndex;
  }
  set spriteIndex(value: number) {
    this._spriteIndex = value;
    this.needsTextureReplacement = true;
  }

  get label(): string {
    return this._label;
  }
  set label(value: string) {
    this._label = value;
    this.needsLabelUpdate = true;
  }

  turnToward(target: Vector) {
    const direction = target.clone().subtract(this.pos);
    for (const d2 of DIRECTIONS) {
      if (d2[0].equals(direction)) {
        this.orientation = d2[1];
        break;
      }
    }
  }
}

export class SpriteSystem extends System {
  family!: Family;
  game: GameInterface;
  container: Container;

  constructor(game: GameInterface, container: Container) {
    super();
    this.game = game;
    this.container = container;
  }

  onAttach(engine: Engine) {
    super.onAttach(engine);
    this.family = new FamilyBuilder(engine).include(SpriteC).build();
  }

  update(engine: Engine, delta: number) {
    for (let entity of this.family.entities) {
      const spriteC = entity.getComponent(SpriteC);
      if (!spriteC.sprite) {
        spriteC.sprite = new Sprite(
          this.game.assets.sprites[spriteC.spriteIndex]
        );
        spriteC.sprite.anchor.set(0.5, 0.5);
        this.container.addChild(spriteC.sprite);
      }

      spriteC.sprite.position.set(
        spriteC.pos.x * this.game.tileSize + this.game.tileSize / 2,
        spriteC.pos.y * this.game.tileSize + this.game.tileSize / 2
      );
      spriteC.sprite.angle = 90 * spriteC.orientation;

      if (spriteC.needsTextureReplacement) {
        spriteC.needsTextureReplacement = false;
        spriteC.sprite.texture = this.game.assets.sprites[spriteC.spriteIndex];
      }

      if (spriteC.needsLabelUpdate) {
        spriteC.needsLabelUpdate = false;
        if (spriteC.text === null) {
          spriteC.text = new Text(spriteC.label, {
            fontSize: 36,
            fontFamily: "Barlow Condensed",
            fill: "red",
            align: "left",
          });
          spriteC.text.position.set(4, 4);
          spriteC.sprite.addChild(spriteC.text);
        }
        spriteC.text.text = spriteC.label;
      }
    }
  }

  /* helpers */

  findEntity(pos: Vector): Entity | null {
    for (let entity of this.family.entities) {
      const spriteC = entity.getComponent(SpriteC);
      if (spriteC.pos.equals(pos)) return entity;
    }
    return null;
  }
}
