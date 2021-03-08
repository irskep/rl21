import { AbstractVector, Vector } from "vector2d";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { getDirectionVector } from "../direction";
import {
  ensureStandingAndTargetIsAdjacentEnemy,
  ensureTargetClear,
  ensureTargetExists,
} from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";

export class SuperpunchPrepare implements Move {
  name = "Superpunch Prepare";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 101;
  }

  apply(ctx: MoveContext, target: AbstractVector): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    spriteC.turnToward(target);
    combatC.setState(CombatState.PunchTelegraph, spriteC);
    combatC.superpunchTarget = ctx.ecs.spriteSystem.findEntity(target);
    ctx.ecs.writeMessage(
      `${spriteC.flavorName} winds up for a heavy unblockable punch.`
    );
    return false;
  }
}

export class SuperpunchFollowthroughHit implements Move {
  name = "Superpunch Followthrough (hit)";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
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

    return ensureTargetExists(ctx, target);
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 100;
  }

  apply(ctx: MoveContext, target: AbstractVector): boolean {
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

export class SuperpunchFollowthroughMiss implements Move {
  name = "Superpunch Followthrough (miss)";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
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

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 100;
  }

  apply(ctx: MoveContext): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    // stumble forward
    combatC.setState(CombatState.PunchFollowthrough, spriteC); // ok
    spriteC.pos = spriteC.pos.add(getDirectionVector(spriteC.orientation));
    ctx.ecs.writeMessage(`${spriteC.flavorName} swings at nothing but air!`);
    return false;
  }
}
