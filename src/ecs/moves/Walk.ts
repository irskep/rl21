import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { isAdjacent } from "../../game/tilemap";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { ensureTargetClear } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
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
      // case CombatState.Punched:
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

    ctx.entity.getComponent(CombatC).setState(CombatState.Standing, c);

    return false;
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 0;
  }
}
