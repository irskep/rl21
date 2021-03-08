import { Vector } from "vector2d";
import { Action } from "../../input";
import { isAdjacent } from "../../tilemap";
import { CombatC, CombatState } from "../combat";
import { ensureTargetIsEnemy } from "./moveHelpers";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "../sprite";

export class Counter implements Move {
  action = Action.Y;
  name = "Counter";
  help = "If an enemy is about to strike, counter their move";

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);
    if (combatC.state != CombatState.Normal) {
      return { success: false, message: "Not in the right state" };
    }
    const checkResult = ensureTargetIsEnemy(ctx, target, combatC.isPlayer);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(spriteC.pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    const enemy = ctx.ecs.spriteSystem.findEntity(target)!;
    const enemyState = enemy.getComponent(CombatC).state;
    switch (enemyState) {
      case CombatState.PunchTelegraph:
        return { success: true };
      default:
        return { success: false, message: "Enemy is not winding up to strike" };
    }
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: Vector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    spriteC.turnToward(target);

    // swap positions, prone the enemy
    const enemy = ctx.ecs.spriteSystem.findEntity(target)!;
    const enemyCombatC = enemy.getComponent(CombatC);
    const enemySpriteC = enemy.getComponent(SpriteC);

    // const orientation = spriteC.orientation;
    const enemyOrientation = enemySpriteC.orientation;
    spriteC.orientation = enemyOrientation;
    const playerPos = spriteC.pos;
    spriteC.pos = enemySpriteC.pos;
    enemySpriteC.pos = playerPos;

    ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

    setTimeout(() => {
      enemyCombatC.becomeProne(2, enemySpriteC);
      doNext();
    }, 500);
    return true;
  }
}
