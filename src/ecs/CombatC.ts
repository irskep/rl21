import { Component } from "@nova-engine/ecs";
import { Move } from "./moves/_types";
import { SpriteC } from "./sprite";
import {
  CombatState,
  stateToPlayerSpriteIndex,
  stateToHenchmanSpriteIndex,
} from "./CombatState";

export class CombatC implements Component {
  state = CombatState.Standing;
  spriteIndexOverride: number | null = null;
  needsToMove = true;
  moves: Move[] = [];
  isPlayer = false;
  recoveryTimer = 0;

  build(moves: Move[]): CombatC {
    this.moves = moves;
    return this;
  }

  get hoverText(): string {
    return this.state;
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
