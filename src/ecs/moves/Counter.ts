import { AbstractVector, Vector } from "vector2d";
import { Action } from "../../game/input";
import { isAdjacent } from "../../game/tilemap";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { ensureTargetIsEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import { CombatEventType } from "../CombatS";
import { STATS } from "../stats";

export class Counter implements Move {
  action = Action.Y;
  name = "Counter";
  help = "If an enemy is about to strike, counter their move";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);
    if (combatC.state != CombatState.Standing) {
      return { success: false, message: "Not in the right state" };
    }
    const checkResult = ensureTargetIsEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(spriteC.pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemyState = enemy.getComponent(CombatC).state;
    switch (enemyState) {
      case CombatState.PunchTelegraph:
        return { success: true };
      default:
        return { success: false, message: "Enemy is not winding up to strike" };
    }
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    spriteC.turnToward(target);

    // swap positions, prone the enemy
    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemyCombatC = enemy.getComponent(CombatC);
    const enemySpriteC = enemy.getComponent(SpriteC);

    // const orientation = spriteC.orientation;
    const enemyOrientation = enemySpriteC.orientation;
    spriteC.orientation = enemyOrientation;
    const playerPos = spriteC.pos;
    spriteC.pos = enemySpriteC.pos;
    enemySpriteC.pos = playerPos;

    ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

    ctx.ecs.combatSystem.events.emit({
      type: CombatEventType.Counter,
      subject: ctx.entity,
      object: enemy,
    });
    ctx.ecs.combatSystem.changeHP(enemy, -STATS.COUNTER_DAMAGE);
    ctx.ecs.writeMessage(
      `${spriteC.flavorName} counters ${enemySpriteC.flavorName}’s punch!`
    );

    setTimeout(() => {
      enemyCombatC.becomeProne(2, enemySpriteC);
      ctx.ecs.writeMessage(
        `${enemySpriteC.flavorName} is knocked to the ground for ${enemyCombatC.recoveryTimer} turns.`
      );
      doNext();
    }, 500);
    return true;
  }
}
