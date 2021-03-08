import { Vector } from "vector2d";
import { isAdjacent } from "../../tilemap";
import { CombatC, CombatState } from "../combat";
import { getDirectionVector } from "../direction";
import { ensureTargetClear, ensureTargetIsEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";

export class TelegraphedPunchPrepare implements Move {
  name = "Telegraphed Punch Prepare";
  help = "?";

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.state != CombatState.Standing) {
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
    ctx.ecs.writeMessage(`${spriteC.name} winds up for a punch.`);
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

    const enemy = ctx.ecs.spriteSystem.findEntity(target)!;
    const enemySpriteC = enemy.getComponent(SpriteC);
    // face attacker
    enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
    ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);
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
    ctx.ecs.writeMessage(`${spriteC.name} swings at nothing but air!`);
    return false;
  }
}
