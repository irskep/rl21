import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem, SpriteC } from "./sprite";
import { GameInterface } from "../types";
import { Vector } from "vector2d";
import { ECS } from "./ecsTypes";
import { BM_MOVES, HENCHMAN_MOVES } from "./moves/moveLists";
import { CombatC, CombatSystem } from "./combat";

function makeEntity(): Entity {
  const e = new Entity();
  e.id = getID();
  return e;
}

function makePlayer(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  if (e.id != 0) {
    throw new Error("player should always be 0");
  }

  e.putComponent(SpriteC).build(pos, SpriteIndices.BM_STAND);
  e.getComponent(SpriteC).orientation = orientation;
  e.putComponent(CombatC).build(BM_MOVES);
  e.getComponent(CombatC).isPlayer = true;

  return e;
}

function makeThug(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(pos, SpriteIndices.STAND);
  e.getComponent(SpriteC).orientation = orientation;
  e.putComponent(CombatC).build(HENCHMAN_MOVES);
  return e;
}

export function makeECS(game: GameInterface, container: Container): ECS {
  const engine = new Engine();

  const spriteSystem = new SpriteSystem(game, container);
  const combatSystem = new CombatSystem(game);

  engine.addSystems(combatSystem);
  engine.addSystems(spriteSystem);

  const player = makePlayer(new Vector(7, 14), 0);
  engine.addEntity(player);

  engine.addEntity(makeThug(new Vector(7, 11), 2));

  const ecs = {
    engine: engine,
    combatSystem: combatSystem,
    spriteSystem: spriteSystem,
    player,
  };
  combatSystem.ecs = ecs;
  return ecs;
}
