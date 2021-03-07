import { Vector } from "vector2d";
import { Action } from "../input";
import { isAdjacent } from "../tilemap";
import { CombatC, CombatState, CombatSystem } from "./combat";
import { getDirectionVector } from "./direction";
import { ensureTargetClear, ensureTargetIsEnemy } from "./moveHelpers";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "./sprite";

export class Walk implements Move {
  name = "Walk";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const checkResult = ensureTargetClear(ctx, target);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    return { success: true };
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const c = ctx.entity.getComponent(SpriteC);
    c.turnToward(target);
    c.pos = target;

    return true;
  }
}

export class Wait implements Move {
  name = "Wait";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    if (ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return { success: true };
    } else {
      return { success: false, message: "Must click on yourself" };
    }
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    // Upon waiting, return to normal state
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.Normal, ctx.entity.getComponent(SpriteC));

    return true;
  }
}

export class TelegraphedPunchPrepare implements Move {
  name = "Telegraphed Punch Prepare";
  help = "?";

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.state != CombatState.Normal) {
      return { success: false, message: "Not in the right state" };
    }
    const checkResult = ensureTargetIsEnemy(ctx, target, combatC.isPlayer);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 100; // henchmen really want to punch Batman.
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    return true;
  }
}

export class TelegraphedPunchFollowthrough implements Move {
  name = "Telegraphed Punch Followthrough";
  help = "?";

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.state != CombatState.PunchTelegraph) {
      return { success: false, message: "Not in the right state" };
    }

    const spriteC = ctx.entity.getComponent(SpriteC);
    const isTargetInTheRightDirection = spriteC.pos
      .clone()
      .add(getDirectionVector(spriteC.orientation))
      .equals(target);

    if (!isTargetInTheRightDirection) {
      return {
        success: false,
        message: "Momentum is in a different direction",
      };
    }

    const isEmptyResult = ensureTargetClear(ctx, target);
    const isEnemyResult = ensureTargetIsEnemy(ctx, target, combatC.isPlayer);

    if (isEmptyResult.success) return isEmptyResult;
    if (isEnemyResult.success) return isEnemyResult;

    return { success: false, message: "Target is not empty or an enemy" };
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 100; // henchmen really want to punch Batman.
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);

    const isEmptyResult = ensureTargetClear(ctx, target);
    const isEnemyResult = ensureTargetIsEnemy(ctx, target, combatC.isPlayer);

    combatC.setState(CombatState.PunchFollowthrough, spriteC);

    if (isEnemyResult.success) {
      const enemy = ctx.ecs.spriteSystem.findEntity(target);
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy);
    } else if (isEmptyResult.success) {
      // stumble forward
      spriteC.pos = spriteC.pos.add(getDirectionVector(spriteC.orientation));
    }

    return true;
  }
}

export const BM_MOVES: Move[] = [new Wait(), new Walk()];
export const HENCHMAN_MOVES: Move[] = [
  new TelegraphedPunchPrepare(),
  new TelegraphedPunchFollowthrough(),
];
