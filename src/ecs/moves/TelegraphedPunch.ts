import { AbstractVector, Vector } from "vector2d";
import { isAdjacent } from "../../game/tilemap";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { getDirectionVector } from "../direction";
import {
  ensureStandingAndTargetIsAdjacentEnemy,
  ensureTargetClear,
  ensureTargetExists,
  ensureTargetIsEnemy,
} from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { CombatEventType } from "../combat/CombatS";

export class TelegraphedPunchPrepare implements Move {
  name = "Telegraphed Punch Prepare";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 100; // henchmen really want to punch Batman.
  }

  apply(ctx: MoveContext, target: AbstractVector): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    ctx.ecs.writeMessage(`${spriteC.flavorName} winds up for a punch.`);
    return false;
  }
}

export class TelegraphedPunchFollowthroughHit implements Move {
  name = "Telegraphed Punch Followthrough (hit)";
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

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);

    combatC.setState(CombatState.PunchFollowthrough, spriteC);

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemySpriteC = enemy.getComponent(SpriteC);
    // face attacker
    enemySpriteC.turnToward(spriteC.pos);
    ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);
    ctx.ecs.spriteSystem.cowboyUpdate();

    setTimeout(() => {
      combatC.setState(CombatState.Standing, spriteC);
      ctx.ecs.spriteSystem.cowboyUpdate();
      doNext();
    }, 300);
    return true;
  }
}

export class TelegraphedPunchFollowthroughMiss implements Move {
  name = "Telegraphed Punch Followthrough (miss)";
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

    return ensureTargetClear(ctx, target);
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 100;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    // stumble forward
    combatC.setState(CombatState.PunchFollowthrough, spriteC); // ok
    spriteC.pos = spriteC.pos.add(getDirectionVector(spriteC.orientation));
    ctx.ecs.writeMessage(
      `${spriteC.flavorName} swings at nothing but air and stumbles forward!`
    );

    ctx.ecs.spriteSystem.cowboyUpdate();

    ctx.ecs.combatSystem.events.emit({
      type: CombatEventType.MissedPunch,
      subject: ctx.entity,
    });

    setTimeout(() => {
      if (ctx.ecs.rng.choice([0, 0, 1]) === 1) {
        ctx.ecs.writeMessage(
          `${spriteC.flavorName} loses their balance and falls to the ground! (33% chance)`
        );
        combatC.becomeProne(2, spriteC);
      } else {
        combatC.becomeStunned(1, spriteC);
      }

      ctx.ecs.spriteSystem.cowboyUpdate();
      doNext();
    }, 300);

    return true;
  }
}
