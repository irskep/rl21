import { Component, Entity } from "@nova-engine/ecs";
import { Move } from "./moves/_types";
import { SpriteC } from "./sprite";
import {
  CombatState,
  stateToPlayerSpriteIndex,
  stateToHenchmanSpriteIndex,
} from "./CombatState";
import { CombatTrait } from "./CombatTrait";
import { Goal } from "./Goal";

export class CombatC implements Component {
  state = CombatState.Standing;
  traits = new Array<CombatTrait>();
  spriteIndexOverride: number | null = null;
  needsToMove = true;
  moves: Move[] = [];
  isPlayer = false;
  recoveryTimer = 0;
  hpMax = 10;
  hp = 10;
  goal: Goal | null = null;

  superpunchTarget: Entity | null = null;

  static tag = "CombatC";

  build(hp: number, moves: Move[], traits: CombatTrait[]): CombatC {
    this.hp = hp;
    this.hpMax = hp;
    this.moves = moves;
    this.traits = traits;
    return this;
  }

  get hoverText(): string {
    const hpText = `HP: ${this.hp}/${this.hpMax}`;
    const traitsText = this.traits.join("\n");
    let text = hpText + "\n\n";
    if (this.recoveryTimer) {
      text += `${this.state} for ${this.recoveryTimer} turns`;
    } else {
      text += this.state;
    }
    text += "\n\n";
    text += traitsText;
    return text;
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
