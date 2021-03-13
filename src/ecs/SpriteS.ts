import {
  Engine,
  System,
  FamilyBuilder,
  Family,
  Entity,
} from "@nova-engine/ecs";
import { Container, Sprite, Text } from "pixi.js";
import { AbstractVector } from "vector2d";
import { GameInterface, TILE_SIZE } from "../types";
import { CombatC } from "./combat/CombatC";
import { ItemC } from "./ItemC";
import { SpriteC } from "./SpriteC";

export class SpriteSystem extends System {
  family!: Family;
  game: GameInterface;
  container: Container;

  static default: SpriteSystem;

  constructor(game: GameInterface, container: Container) {
    super();
    this.game = game;
    this.container = container;
    this.container.sortableChildren = true;

    SpriteSystem.default = this;
  }

  onAttach(engine: Engine) {
    super.onAttach(engine);
    this.family = new FamilyBuilder(engine).include(SpriteC).build();
  }

  cowboyUpdate() {
    this.update(this.engines[0], 0);
  }

  setPosition(obj: Sprite, pos: AbstractVector) {
    obj.position.set(
      pos.x * TILE_SIZE + TILE_SIZE / 2,
      pos.y * TILE_SIZE + TILE_SIZE / 2
    );
  }

  updateSprite(spriteC: SpriteC) {
    if (!spriteC.sprite) {
      throw new Error("Must make sprite first");
    }

    spriteC.sprite.zIndex = spriteC.zIndex;
    // ignoring tint for now
    // spriteC.sprite.tint = spriteC.tint;

    this.setPosition(spriteC.sprite, spriteC.pos);
    spriteC.sprite.angle = 90 * (spriteC.orientation + 2);

    if (spriteC.needsTextureReplacement) {
      spriteC.needsTextureReplacement = false;
      spriteC.sprite.texture = this.game.filmstrips[spriteC.spriteSheet][
        spriteC.spriteIndex
      ];
    }

    if (spriteC.needsLabelUpdate) {
      spriteC.needsLabelUpdate = false;
      if (spriteC.text === null) {
        spriteC.text = new Text(spriteC.label, {
          fontSize: 9,
          fontFamily: "Barlow Condensed",
          fill: "red",
          align: "left",
        });
        spriteC.text.position.set(0, 0);
        spriteC.sprite.addChild(spriteC.text);
      }
      spriteC.text.text = spriteC.label;
    }
    if (spriteC.text) {
      spriteC.text.angle = 90 * (4 - spriteC.orientation);
    }
  }

  update(engine: Engine, delta: number) {
    for (let entity of this.family.entities) {
      const spriteC = entity.getComponent(SpriteC);
      if (!spriteC.sprite) {
        const texture = this.game.filmstrips[spriteC.spriteSheet][
          spriteC.spriteIndex
        ];
        spriteC.sprite = new Sprite(texture);
        spriteC.sprite.anchor.set(0.5, 0.5);
        this.container.addChild(spriteC.sprite);
      }
      this.updateSprite(spriteC);
    }
    this.container.sortChildren();
  }

  /* helpers */

  findCombatEntity(pos: AbstractVector): Entity | null {
    for (let entity of this.family.entities) {
      const spriteC = entity.getComponent(SpriteC);
      if (spriteC.pos.equals(pos) && entity.hasComponent(CombatC)) {
        return entity;
      }
    }
    return null;
  }

  findInterestingObjects(): Entity[] {
    return this.family.entities.filter((e) => e.hasComponent(ItemC));
  }

  findInterestingObject(pos: AbstractVector): Entity | null {
    const objects = this.findInterestingObjects().filter((o) =>
      o.getComponent(SpriteC).pos.equals(pos)
    );
    return objects.length ? objects[0] : null;
  }
}

(SpriteC as any).tag = "SpriteC";