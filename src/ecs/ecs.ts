import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem, SpriteC } from "./sprite";
import { GameInterface } from "../types";
import { Vector } from "vector2d";

export interface ECS {
  engine: Engine;
  spriteSystem: SpriteSystem;
  player: Entity;
}

function makePlayer(pos: Vector): Entity {
  const player = new Entity();
  player.id = getID();
  if (player.id != 0) {
    throw new Error("player should always be 0");
  }

  player.putComponent(SpriteC).build(pos, SpriteIndices.BM_STAND);

  return player;
}

export function makeECS(game: GameInterface, container: Container): ECS {
  const engine = new Engine();

  const spriteSystem = new SpriteSystem(game, container);

  engine.addSystems(spriteSystem);

  const player = makePlayer(new Vector(7, 14));
  engine.addEntity(player);

  return {
    engine: engine,
    spriteSystem: spriteSystem,
    player,
  };
}
