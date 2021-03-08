import { Vector } from "vector2d";
import { Action } from "../../input";
import { isAdjacent } from "../../tilemap";
import { CombatC, CombatState } from "../combat";
import { ensureTargetIsEnemy } from "./moveHelpers";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "../sprite";

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

    const enemy = ctx.ecs.spriteSystem.findEntity(target)!;
    const enemyState = enemy.getComponent(CombatC).state;
    switch (enemyState) {
      case CombatState.Prone:
        return { success: false, message: "Enemy is on the ground" };
      default:
        break;
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
      const combatC = ctx.entity.getComponent(CombatC);
      combatC.setState(CombatState.PunchFollowthrough, spriteC);

      const enemy = ctx.ecs.spriteSystem.findEntity(target)!;
      const enemySpriteC = enemy.getComponent(SpriteC);
      // face attacker
      enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);

      ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

      setTimeout(() => {
        combatC.setState(CombatState.Normal, spriteC);
        ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);
        doNext();
      }, 500);
    }, 500);
    return true;
  }
}
