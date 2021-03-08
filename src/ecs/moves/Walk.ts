import { AbstractVector } from "vector2d";
import { Action } from "../../input";
import { isAdjacent } from "../../tilemap";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { ensureTargetClear } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import UnreachableCaseError from "../../UnreachableCaseError";

export class Walk implements Move {
  name = "Walk";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureTargetClear(ctx, target);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    const state = ctx.entity.getComponent(CombatC).state;
    switch (state) {
      case CombatState.Standing:
        return { success: true };
      case CombatState.Prone:
        return { success: false, message: "Prone" };
      case CombatState.Punched:
      case CombatState.Stunned:
        return { success: false, message: "Reeling from punch" };
      case CombatState.PunchFollowthrough:
      case CombatState.PunchTelegraph:
      case CombatState.SuperpunchFollowthrough:
      case CombatState.SuperpunchTelegraph:
        return { success: false, message: "?" };
      default:
        throw new UnreachableCaseError(state);
    }
  }

  apply(ctx: MoveContext, target: AbstractVector): boolean {
    const c = ctx.entity.getComponent(SpriteC);
    c.turnToward(target);
    c.pos = target;

    return false;
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 0;
  }
}
