import {
  Component,
  Engine,
  Family,
  FamilyBuilder,
  System,
} from "@nova-engine/ecs";
import { SpriteIndices } from "../assets";
import { GameInterface } from "../types";
import { Move } from "./moveTypes";
import { SpriteC } from "./sprite";

enum CombatState {
  Normal = "Normal",
  PunchTelegraph = "PunchTelegraph",
  PunchFollowthrough = "PunchFollowthrough",
}

export class CombatC implements Component {
  state = CombatState.Normal;
  spriteIndexOverride: number | null = null;
  needsToMove = true;
  moves: Move[] = [];
  isPlayer = false;

  build(moves: Move[]): CombatC {
    this.moves = moves;
    return this;
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
      switch (newState) {
        case CombatState.Normal:
          spriteC.spriteIndex = SpriteIndices.BM_STAND;
        case CombatState.PunchTelegraph:
          spriteC.spriteIndex = SpriteIndices.BM_PUNCH_BEFORE;
        case CombatState.PunchFollowthrough:
          spriteC.spriteIndex = SpriteIndices.BM_PUNCH_AFTER;
      }
    } else {
      switch (newState) {
        case CombatState.Normal:
          spriteC.spriteIndex = SpriteIndices.STAND;
        case CombatState.PunchTelegraph:
          spriteC.spriteIndex = SpriteIndices.PUNCH_BEFORE;
        case CombatState.PunchFollowthrough:
          spriteC.spriteIndex = SpriteIndices.PUNCH_AFTER;
      }
    }
  }
}

export class CombatSystem extends System {
  family: Family;
  game: GameInterface;
  isProcessing = false;

  constructor(game: GameInterface) {
    super();
    this.game = game;
  }

  onAttach(engine: Engine) {
    super.onAttach(engine);
    this.family = new FamilyBuilder(engine)
      .include(CombatC)
      .include(SpriteC)
      .build();
  }

  update(engine: Engine, delta: number) {
    this.isProcessing = true;
    for (let entity of this.family.entities) {
      // const combatC = entity.getComponent(CombatC);
      // do combat logic here
    }
    this.isProcessing = false;
  }

  reset(engine: Engine) {
    for (let entity of this.family.entities) {
      entity.getComponent(CombatC).needsToMove = true;
    }
  }
}
