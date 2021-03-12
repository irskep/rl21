import { Engine, Entity } from "@nova-engine/ecs";
import { AbstractVector } from "vector2d";
import RNG from "../game/RNG";
import { Tilemap } from "../game/tilemap";
import { CombatSystem } from "./combat/CombatS";
import { Difficulty } from "./difficulties";
import { SpriteSystem } from "./SpriteS";

export interface ECS {
  engine: Engine;
  difficulty: Difficulty;
  combatSystem: CombatSystem;
  spriteSystem: SpriteSystem;
  player: Entity;
  tilemap: Tilemap;
  rng: RNG;
  addGun: (pos: AbstractVector) => void;
  remove: (e: Entity) => void;
  writeMessage: (msg: string) => void;
}
