import { Engine, Entity } from "@nova-engine/ecs";
import { CombatSystem } from "./combat";
import { SpriteSystem } from "./sprite";

export interface ECS {
  engine: Engine;
  combatSystem: CombatSystem;
  spriteSystem: SpriteSystem;
  player: Entity;
}
