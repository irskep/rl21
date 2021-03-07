import {
  Engine,
  Entity,
  Component,
  System,
  FamilyBuilder,
  Family,
} from "@nova-engine/ecs";
import { Container, Sprite } from "pixi.js";
import * as Vec2D from "vector2d";
import { SpriteIndices } from "./assets";
import getID from "./getID";
import { GameInterface } from "./types";

export class SpriteC implements Component {
  pos = new Vec2D.Vector(0, 0);
  private _spriteIndex = 0;
  needsTextureReplacement = false;
  sprite?: Sprite;

  build(pos: Vec2D.Vector, spriteIndex: number): SpriteC {
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
}

export class SpriteSystem extends System {
  family: Family;
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

      if (spriteC.needsTextureReplacement) {
        spriteC.needsTextureReplacement = false;
        spriteC.sprite.texture = this.game.assets.sprites[spriteC.spriteIndex];
      }
    }
  }
}

export interface ECS {
  engine: Engine;
  spriteSystem: SpriteSystem;
}

function makePlayer(): Entity {
  const player = new Entity();
  player.id = getID();
  if (player.id != 0) {
    throw new Error("player should always be 0");
  }

  player
    .putComponent(SpriteC)
    .build(new Vec2D.Vector(4, 4), SpriteIndices.BM_STAND);

  return player;
}

export function makeECS(game: GameInterface, container: Container): ECS {
  const engine = new Engine();

  const spriteSystem = new SpriteSystem(game, container);

  engine.addSystems(spriteSystem);

  engine.addEntity(makePlayer());

  return {
    engine: engine,
    spriteSystem: spriteSystem,
  };
}
