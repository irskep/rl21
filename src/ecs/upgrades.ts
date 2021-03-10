import { Entity } from "@nova-engine/ecs";
import { CombatC } from "./combat/CombatC";
import { GroundTakedown } from "./moves/GroundTakedown";

export interface Upgrade {
  name: string;
  description: string;
  exclusive: boolean;
  apply: (player: Entity) => void;
}

export function makeUpgradePool(): Upgrade[] {
  return [
    {
      name: "Ground Takedown",
      exclusive: true,
      description:
        "If an enemy is prone, knock them out immediately, regardless of their remaining hit points.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).moves.push(new GroundTakedown());
      },
    },
    {
      name: "Toughen Up",
      exclusive: false,
      description: "2 extra hit points.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).hpMax += 2;
        player.getComponent(CombatC).hp += 2;
      },
    },
  ];
}
