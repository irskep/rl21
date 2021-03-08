import { Engine, Entity } from "@nova-engine/ecs";
import { Tilemap } from "../tilemap";
import { CombatSystem } from "./CombatS";
import { SpriteSystem } from "./sprite";

export interface ECS {
  engine: Engine;
  combatSystem: CombatSystem;
  spriteSystem: SpriteSystem;
  player: Entity;
  tilemap: Tilemap;
  writeMessage: (msg: string) => void;
}
