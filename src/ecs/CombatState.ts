import { SpriteIndices } from "../assets";
import UnreachableCaseError from "../UnreachableCaseError";

export enum CombatState {
  Standing = "Standing",
  PunchTelegraph = "PunchTelegraph",
  PunchFollowthrough = "PunchFollowthrough",
  SuperpunchTelegraph = "SuperpunchTelegraph",
  SuperpunchFollowthrough = "SuperpunchFollowthrough",
  Punched = "Punched",
  Prone = "Prone",
  Stunned = "Stunned",
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
    case CombatState.Punched:
      return SpriteIndices.STUMBLING;
    case CombatState.Prone:
      return SpriteIndices.BM_DEAD;
    case CombatState.Stunned:
      return SpriteIndices.STUNNED;
    default:
      throw new UnreachableCaseError(state);
  }
}

export function stateToHenchmanSpriteIndex(state: CombatState): number {
  switch (state) {
    case CombatState.Standing:
      return SpriteIndices.STAND;
    case CombatState.PunchTelegraph:
      return SpriteIndices.PUNCH_BEFORE;
    case CombatState.PunchFollowthrough:
      return SpriteIndices.PUNCH_AFTER;
    case CombatState.SuperpunchTelegraph:
      return SpriteIndices.SUPERPUNCH_BEFORE;
    case CombatState.SuperpunchFollowthrough:
      return SpriteIndices.SUPERPUNCH_AFTER;
    case CombatState.Punched:
      return SpriteIndices.STUMBLING;
    case CombatState.Prone:
      return SpriteIndices.PRONE;
    case CombatState.Stunned:
      return SpriteIndices.STUNNED;
    default:
      throw new UnreachableCaseError(state);
  }
}
