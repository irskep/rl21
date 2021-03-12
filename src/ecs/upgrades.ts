import { Entity } from "@nova-engine/ecs";
import { CombatC } from "./combat/CombatC";
import { Atarangs } from "./moves/Atarangs";
import { LungePunch } from "./moves/FastPunch";
import { GroundTakedown } from "./moves/GroundTakedown";
import { LegSweep } from "./moves/LegSweep";
import { SuperDodge } from "./moves/SuperDodge";

export interface Upgrade {
  name: string;
  description: string;
  exclusive: boolean;
  apply: (player: Entity) => void;
}

export function makeUpgradePool(): Upgrade[] {
  return [
    {
      name: "Lunge Punch",
      exclusive: true,
      description: "Punch an enemy 2 tiles away for 2 hit points.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).moves.push(new LungePunch());
      },
    },
    {
      name: "Atarangs",
      exclusive: true,
      description:
        "Up to 3 times per stage, throw an Atarang at a distant enemy to damage and stun them.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).moves.push(new Atarangs());
      },
    },
    {
      name: "Leg Sweep",
      exclusive: true,
      description:
        "Knock adjacent enemies prone, but the lesser of half your remaining hit points or 3 hit points.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).moves.push(new LegSweep());
      },
    },
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
      name: "Super Dodge",
      exclusive: true,
      description: "Leap over enemies to the space behind them.",
      apply: (player: Entity) => {
        player.getComponent(CombatC).moves.push(new SuperDodge());
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
