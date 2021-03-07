import {
  Component,
  Engine,
  Entity,
  Family,
  FamilyBuilder,
  System,
} from "@nova-engine/ecs";
import { Vector } from "vector2d";
import { SpriteIndices } from "../assets";
import { Tilemap } from "../tilemap";
import { GameInterface } from "../types";
import { getNeighbors } from "./direction";
import { ECS } from "./ecsTypes";
import { Move } from "./moveTypes";
import { SpriteC } from "./sprite";

export enum CombatState {
  Normal = "Normal",
  PunchTelegraph = "PunchTelegraph",
  PunchFollowthrough = "PunchFollowthrough",
  Punched = "Punched",
}

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`);
  }
}

function stateToPlayerSpriteIndex(state: CombatState): number {
  switch (state) {
    case CombatState.Normal:
      return SpriteIndices.BM_STAND;
    case CombatState.PunchTelegraph:
      return SpriteIndices.BM_PUNCH_BEFORE;
    case CombatState.PunchFollowthrough:
      return SpriteIndices.BM_PUNCH_AFTER;
    case CombatState.Punched:
      return SpriteIndices.STUMBLING;
    default:
      throw new UnreachableCaseError(state);
  }
}

function stateToHenchmanSpriteIndex(state: CombatState): number {
  switch (state) {
    case CombatState.Normal:
      return SpriteIndices.STAND;
    case CombatState.PunchTelegraph:
      return SpriteIndices.PUNCH_BEFORE;
    case CombatState.PunchFollowthrough:
      return SpriteIndices.PUNCH_AFTER;
    case CombatState.Punched:
      return SpriteIndices.STUMBLING;
    default:
      throw new UnreachableCaseError(state);
  }
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
      spriteC.spriteIndex = stateToPlayerSpriteIndex(newState);
    } else {
      spriteC.spriteIndex = stateToHenchmanSpriteIndex(newState);
    }
  }
}

export class CombatSystem extends System {
  family: Family;
  game: GameInterface;
  isProcessing = false;
  ecs: ECS;
  tilemap: Tilemap;

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
      const combatC = entity.getComponent(CombatC);
      if (combatC.isPlayer) continue;
      if (!combatC.needsToMove) continue;
      combatC.needsToMove = false;

      const spriteC = entity.getComponent(SpriteC);

      const moveContext = { entity, ecs: this.ecs, tilemap: this.tilemap };
      const availableMoves: [Move, Vector][] = [];
      for (let m of combatC.moves) {
        for (let n of getNeighbors(spriteC.pos).concat(spriteC.pos)) {
          if (m.check(moveContext, n).success) {
            availableMoves.push([m, n]);
          }
        }
      }

      availableMoves.sort((a, b) => {
        return (
          b[0].computeValue(moveContext, b[1]) -
          a[0].computeValue(moveContext, a[1])
        );
      });

      if (availableMoves.length > 0) {
        const [m, target] = availableMoves[0];
        console.log("Apply", m, "from", entity, "to", target);
        m.apply(moveContext, target);
      }
    }
    this.isProcessing = false;
  }

  reset(engine: Engine) {
    for (let entity of this.family.entities) {
      entity.getComponent(CombatC).needsToMove = true;
    }
  }

  applyPunch(attacker: Entity, defender: Entity) {
    const defenderCombatC = defender.getComponent(CombatC);
    switch (defenderCombatC.state) {
      case CombatState.Normal:
      case CombatState.PunchTelegraph:
      case CombatState.PunchFollowthrough:
        defenderCombatC.setState(
          CombatState.Punched,
          defender.getComponent(SpriteC)
        );
    }
  }
}
