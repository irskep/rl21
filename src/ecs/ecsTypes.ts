import { Engine, Entity } from "@nova-engine/ecs";
import RNG from "../game/RNG";
import { Tilemap } from "../game/tilemap";
import { CombatSystem } from "./combat/CombatS";
import { SpriteSystem } from "./sprite";

export interface ECS {
  engine: Engine;
  combatSystem: CombatSystem;
  spriteSystem: SpriteSystem;
  player: Entity;
  tilemap: Tilemap;
  rng: RNG;
  writeMessage: (msg: string) => void;
}
