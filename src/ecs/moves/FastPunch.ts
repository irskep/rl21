import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { ensureStandingAndTargetIsAdjacentEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC, SpriteSystem } from "../sprite";
import { SpriteIndices } from "../../assets";

export class FastPunch implements Move {
  action = Action.X;
  name = "Punch";
  help = "Strike the enemy in the face";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemyState = enemy.getComponent(CombatC).state;
    switch (enemyState) {
      case CombatState.Prone:
        return { success: false, message: "Enemy is on the ground" };
      default:
        break;
    }

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    ctx.ecs.spriteSystem.update(ctx.ecs.engine, 0);

    setTimeout(() => {
      const combatC = ctx.entity.getComponent(CombatC);
      combatC.setState(CombatState.PunchFollowthrough, spriteC);

      const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
      const enemySpriteC = enemy.getComponent(SpriteC);
      // face attacker
      enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);
      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        combatC.setState(
          CombatState.Standing,
          spriteC,
          SpriteIndices.BM_PUNCH_AFTER
        );
        ctx.ecs.spriteSystem.cowboyUpdate();
        doNext();
      }, 300);
    }, 300);
    return true;
  }
}
