import { SpriteIndices } from "../../assets";
import { isAdjacent } from "../../game/tilemap";
import UnreachableCaseError from "../../UnreachableCaseError";
import { CombatTrait } from "./CombatTrait";

export enum CombatState {
  Standing = "Standing",
  PunchTelegraph = "Punch Windup",
  PunchFollowthrough = "Punch Followthrough",
  SuperpunchTelegraph = "Super-punch Windup",
  SuperpunchFollowthrough = "Super-punch Followthrough",
  // Punched = "Punched",
  Prone = "Prone",
  Stunned = "Stunned",
}

export function getStateHelpText(
  state: CombatState,
  traits: CombatTrait[]
): string {
  const isArmored = traits.indexOf(CombatTrait.Armored) !== -1;
  switch (state) {
    case CombatState.Standing:
      if (isArmored) {
        return "Not doing anything in particular. Can be hit, but hits will do no damage unless stunned.";
      } else {
        return "Not doing anything in particular. Can be hit.";
      }
    case CombatState.PunchTelegraph:
      return "About to punch.";
    case CombatState.PunchFollowthrough:
      return "Just punched.";
    case CombatState.SuperpunchTelegraph:
      return "About to punch REALLY HARD. Cannot counter. Dodge away to avoid.";
    case CombatState.SuperpunchFollowthrough:
      return "Just punched REALLY HARD.";
    // case CombatState.Punched:
    //   return SpriteIndices.STUMBLING;
    case CombatState.Prone:
      return "On the ground and out of commission for a bit.";
    case CombatState.Stunned:
      return "Knocked back by a hit. Will need to wait to recover.";
    default:
      throw new UnreachableCaseError(state);
  }
}

export function stateToPlayerSpriteIndex(state: CombatState): number {
  switch (state) {
    case CombatState.Standing:
      return SpriteIndices.BM_STAND;
    case CombatState.PunchTelegraph:
      return SpriteIndices.BM_PUNCH_BEFORE;
    case CombatState.PunchFollowthrough:
      return SpriteIndices.BM_PUNCH_AFTER;
    case CombatState.SuperpunchTelegraph:
      return SpriteIndices.BM_PUNCH_BEFORE;
    case CombatState.SuperpunchFollowthrough:
      return SpriteIndices.BM_PUNCH_AFTER;
    // case CombatState.Punched:
    //   return SpriteIndices.STUMBLING;
    case CombatState.Prone:
      return SpriteIndices.BM_DEAD;
    case CombatState.Stunned:
      return SpriteIndices.STUNNED;
    default:
      throw new UnreachableCaseError(state);
  }
}

export function stateToHenchmanSpriteIndex(
  state: CombatState,
  traits: CombatTrait[]
): number {
  switch (state) {
    case CombatState.Standing:
      if (traits.indexOf(CombatTrait.WieldingGun) !== -1) {
        return SpriteIndices.SHOOT_BEFORE;
      } else {
        return SpriteIndices.STAND;
      }
    case CombatState.PunchTelegraph:
      return SpriteIndices.PUNCH_BEFORE;
    case CombatState.PunchFollowthrough:
      return SpriteIndices.PUNCH_AFTER;
    case CombatState.SuperpunchTelegraph:
      return SpriteIndices.SUPERPUNCH_BEFORE;
    case CombatState.SuperpunchFollowthrough:
      return SpriteIndices.SUPERPUNCH_AFTER;
    // case CombatState.Punched:
    //   return SpriteIndices.STUMBLING;
    case CombatState.Prone:
      return SpriteIndices.PRONE;
    case CombatState.Stunned:
      return SpriteIndices.STUNNED;
    default:
      throw new UnreachableCaseError(state);
  }
}
