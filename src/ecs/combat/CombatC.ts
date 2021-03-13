import { Component, Entity } from "@nova-engine/ecs";
import { Move } from "../moves/_types";
import { SpriteC } from "../SpriteC";
import {
  CombatState,
  stateToPlayerSpriteIndex,
  stateToHenchmanSpriteIndex,
  getStateHelpText,
} from "./CombatState";
import { CombatTrait } from "./CombatTrait";
import { Goal } from "../Goal";

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
  gunCooldown = 0;
  legSweepCooldown = 0;
  upgrades = new Array<string>();

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
    if (this.recoveryTimer === 1) {
      text += `${this.state} for 1 turn.`;
    } else if (this.recoveryTimer > 1) {
      text += `${this.state} for ${this.recoveryTimer} turns.`;
    } else {
      text += this.state;
    }
    text += "\n" + getStateHelpText(this.state, this.traits);
    text += "\n\n";
    // text += traitsText;

    if (this.hasTrait(CombatTrait.WieldingGun)) {
      text += `Turns until gun reload: ${this.gunCooldown}`;
    }
    return text;
  }

  hasTrait(trait: CombatTrait) {
    return this.traits.indexOf(trait) !== -1;
  }

  hasUpgrade(name: string) {
    return this.upgrades.indexOf(name) !== -1;
  }

  becomeProne(turns: number, spriteC: SpriteC) {
    this.setState(CombatState.Prone, spriteC);
    this.recoveryTimer = turns;
    this.updateText(spriteC);
    this.needsToMove = false;
  }

  becomeStunned(turns: number, spriteC: SpriteC) {
    console.log("Stun for", turns, "turns");
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

  addTrait(trait: CombatTrait, spriteC: SpriteC) {
    this.traits.push(trait);
    this.updateSpriteIndex(spriteC);
  }

  removeTrait(trait: CombatTrait, spriteC?: SpriteC) {
    this.traits = this.traits.filter((t) => t !== trait);
    if (spriteC) this.updateSpriteIndex(spriteC);
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

    this.updateSpriteIndex(spriteC);
  }

  private updateSpriteIndex(spriteC: SpriteC) {
    if (this.isPlayer) {
      spriteC.spriteIndex = stateToPlayerSpriteIndex(this.state);
    } else {
      spriteC.spriteIndex = stateToHenchmanSpriteIndex(this.state, this.traits);
    }
  }
}

(CombatC as any).tag = "CombatC";
