import { Component, Entity } from "@nova-engine/ecs";
import { Move } from "./moves/_types";
import { SpriteC } from "./sprite";
import {
  CombatState,
  stateToPlayerSpriteIndex,
  stateToHenchmanSpriteIndex,
} from "./CombatState";
import { CombatTrait } from "./CombatTrait";

export class CombatC implements Component {
  state = CombatState.Standing;
  traits = new Array<CombatTrait>();
  spriteIndexOverride: number | null = null;
  needsToMove = true;
  moves: Move[] = [];
  isPlayer = false;
  recoveryTimer = 0;

  superpunchTarget: Entity | null = null;

  static tag = "CombatC";

  build(moves: Move[], traits: CombatTrait[]): CombatC {
    this.moves = moves;
    this.traits = traits;
    return this;
  }

  get hoverText(): string {
    if (this.recoveryTimer) {
      return `${this.state} for ${
        this.recoveryTimer
      } turns\n\n${this.traits.join("\n")}`;
    } else {
      return `${this.state}\n\n${this.traits.join("\n")}`;
    }
  }

  hasTrait(trait: CombatTrait) {
    return this.traits.indexOf(trait) !== -1;
  }

  becomeProne(turns: number, spriteC: SpriteC) {
    this.setState(CombatState.Prone, spriteC);
    this.recoveryTimer = turns;
    this.updateText(spriteC);
    this.needsToMove = false;
  }

  becomeStunned(turns: number, spriteC: SpriteC) {
    this.setState(CombatState.Stunned, spriteC);
    this.recoveryTimer = turns;
    this.updateText(spriteC);
    this.needsToMove = false;
  }

  updateText(spriteC: SpriteC) {
    if (this.recoveryTimer) {
      spriteC.label = `${this.recoveryTimer}`;
    } else {
      spriteC.label = "";
    }
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

(CombatC as any).tag = "CombatC";
