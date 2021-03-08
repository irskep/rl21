import { Component } from "@nova-engine/ecs";
import { Move } from "./moves/_types";
import { SpriteC } from "./sprite";
import {
  CombatState,
  stateToPlayerSpriteIndex,
  stateToHenchmanSpriteIndex,
} from "./CombatState";

export enum CombatTrait {
  Armored = "Armored",
  Fluid = "Fluid",
  WieldingGun = "WieldingGun",
  WieldingShield = "WieldingShield",
  WieldingShockBaton = "WieldingShockBaton",
}

export class CombatC implements Component {
  state = CombatState.Standing;
  traits = new Array<CombatTrait>();
  spriteIndexOverride: number | null = null;
  needsToMove = true;
  moves: Move[] = [];
  isPlayer = false;
  recoveryTimer = 0;

  build(moves: Move[], traits: CombatTrait[]): CombatC {
    this.moves = moves;
    this.traits = traits;
    return this;
  }

  get hoverText(): string {
    return `${this.state}\n\n${this.traits.join("\n")}`;
  }

  becomeProne(turns: number, spriteC: SpriteC) {
    this.setState(CombatState.Prone, spriteC);
    this.recoveryTimer = turns;
    spriteC.label = `${turns}`;
    this.needsToMove = false;
  }

  becomeStunned(turns: number, spriteC: SpriteC) {
    this.setState(CombatState.Stunned, spriteC);
    this.recoveryTimer = turns;
    spriteC.label = `${turns}`;
    this.needsToMove = false;
  }

  setState(
    newState: CombatState,
    spriteC: SpriteC,
    spriteIndexOverride?: number
  ) {
    this.state = newState;

    if (spriteIndexOverride) {
      spriteC.spriteIndex = spriteIndexOverride;
      return;
    }

    if (this.isPlayer) {
      spriteC.spriteIndex = stateToPlayerSpriteIndex(newState);
    } else {
      spriteC.spriteIndex = stateToHenchmanSpriteIndex(newState);
    }
  }
}
