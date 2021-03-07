import { Vector } from "vector2d";
import { Action } from "../input";
import { isAdjacent } from "../tilemap";
import { CombatC, CombatState, CombatSystem } from "./combat";
import { getDirectionVector } from "./direction";
import { ensureTargetClear, ensureTargetIsEnemy } from "./moveHelpers";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "./sprite";
import UnreachableCaseError from "./UnreachableCaseError";

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

    const state = ctx.entity.getComponent(CombatC).state;
    switch (state) {
      case CombatState.Normal:
        return { success: true };
      case CombatState.Punched:
        return { success: false, message: "Reeling from punch" };
      case CombatState.PunchFollowthrough:
      case CombatState.PunchTelegraph:
        return { success: false, message: "?" };
      default:
        throw new UnreachableCaseError(state);
    }
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const c = ctx.entity.getComponent(SpriteC);
    c.turnToward(target);
    c.pos = target;

    return false;
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 0;
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

  apply(ctx: MoveContext): boolean {
    // Upon waiting, return to normal state
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.Normal, ctx.entity.getComponent(SpriteC));

    return false;
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 0;
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
    return false;
  }
}

export class TelegraphedPunchFollowthroughHit implements Move {
  name = "Telegraphed Punch Followthrough (hit)";
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

    return ensureTargetIsEnemy(ctx, target, combatC.isPlayer);
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 100;
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);

    combatC.setState(CombatState.PunchFollowthrough, spriteC);

    const enemy = ctx.ecs.spriteSystem.findEntity(target);
    const enemySpriteC = enemy.getComponent(SpriteC);
    // face attacker
    enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
    ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy);
    return false;
  }
}

export class TelegraphedPunchFollowthroughMiss implements Move {
  name = "Telegraphed Punch Followthrough (miss)";
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

    // TODO: allow punching allies?
    return ensureTargetClear(ctx, target);
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 100;
  }

  apply(ctx: MoveContext): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    // stumble forward
    combatC.setState(CombatState.PunchFollowthrough, spriteC); // ok
    spriteC.pos = spriteC.pos.add(getDirectionVector(spriteC.orientation));
    return false;
  }
}

export class FastPunch implements Move {
  action = Action.X;
  name = "Punch";
  help = "Strike the enemy in the face";

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
    return 200;
  }

  apply(ctx: MoveContext, target: Vector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

    setTimeout(() => {
      doNext();

      const combatC = ctx.entity.getComponent(CombatC);
      combatC.setState(CombatState.PunchFollowthrough, spriteC);

      const enemy = ctx.ecs.spriteSystem.findEntity(target);
      const enemySpriteC = enemy.getComponent(SpriteC);
      // face attacker
      enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy);

      ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

      setTimeout(() => {
        combatC.setState(CombatState.Normal, spriteC);
        ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);
        doNext();
      }, 300);
    }, 300);
    return true;
  }
}

export const BM_MOVES: Move[] = [new Wait(), new Walk(), new FastPunch()];
export const HENCHMAN_MOVES: Move[] = [
  new TelegraphedPunchPrepare(),
  new TelegraphedPunchFollowthroughHit(),
  new TelegraphedPunchFollowthroughMiss(),
  new Wait(),
];
