import { AbstractVector, Vector } from "vector2d";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { getDirectionVector, getOrientation } from "../direction";
import {
  ensureStandingAndTargetIsAdjacentEnemy,
  ensureTargetClear,
  ensureTargetExists,
} from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import { isAdjacent } from "../../game/tilemap";
import { STATS } from "../stats";
import { CombatEventType } from "../CombatS";

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
    combatC.setState(CombatState.SuperpunchTelegraph, spriteC);
    combatC.superpunchTarget = ctx.ecs.spriteSystem.findCombatEntity(target);
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
    const spriteC = ctx.entity.getComponent(SpriteC);

    if (combatC.state != CombatState.SuperpunchTelegraph) {
      return { success: false, message: "Not in the right state" };
    }

    const enemy = combatC.superpunchTarget;
    if (!enemy) {
      return { success: false, message: "No target" };
    }

    if (isAdjacent(enemy.getComponent(SpriteC).pos, spriteC.pos)) {
      return { success: true };
    }

    const alternativeEnemy = ctx.ecs.spriteSystem.findCombatEntity(
      spriteC.pos.clone().add(getDirectionVector(spriteC.orientation))
    );
    if (alternativeEnemy) {
      // change punch target to whoever is in front of the punch, no matter what team they're on
      combatC.superpunchTarget = alternativeEnemy;
      return { success: true };
    } else {
      return {
        success: false,
        message: "Enemy is not within superpunching distance",
      };
    }
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 100;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);

    const enemy = combatC.superpunchTarget;
    if (!enemy) return false;

    const enemySpriteC = enemy.getComponent(SpriteC);
    const enemyCombatC = enemy.getComponent(CombatC);
    const enemyPos = enemySpriteC.pos.clone();
    // If possible to push enemy (not against a wall), do it
    const didPush = ctx.ecs.combatSystem.push(ctx.entity, enemy, ctx.ecs, 1);
    if (didPush) {
      spriteC.pos = enemyPos;
    }
    spriteC.orientation = getOrientation(
      enemySpriteC.pos.clone().subtract(spriteC.pos)
    );
    enemySpriteC.orientation = (spriteC.orientation + 2) % 4;

    combatC.setState(CombatState.SuperpunchFollowthrough, spriteC);
    enemyCombatC.becomeStunned(1, enemySpriteC);
    ctx.ecs.combatSystem.events.emit({
      type: CombatEventType.Punch,
      subject: ctx.entity,
      object: enemy,
    });
    ctx.ecs.combatSystem.changeHP(enemy, -STATS.SUPERPUNCH_DAMAGE);
    ctx.ecs.writeMessage(
      `${spriteC.flavorName} lands a massive hit on ${enemySpriteC.flavorName}!`
    );
    ctx.ecs.spriteSystem.cowboyUpdate();

    setTimeout(() => {
      combatC.setState(CombatState.PunchFollowthrough, spriteC);
      doNext();
    }, 300);
    return true;
  }
}

export class SuperpunchFollowthroughMiss implements Move {
  name = "Superpunch Followthrough (miss)";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (new SuperpunchFollowthroughHit().check(ctx, target).success) {
      return { success: false, message: "Superpunch should hit" };
    }
    if (!isAdjacent(target, ctx.entity.getComponent(SpriteC).pos)) {
      return { success: false, message: "Not adjacent" };
    }

    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.state != CombatState.SuperpunchTelegraph) {
      return { success: false, message: "Not in the right state" };
    }
    return { success: true };
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
