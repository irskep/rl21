import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { ensureStandingAndTargetIsAdjacentEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import { SpriteIndices } from "../../assets";

export class Stun implements Move {
  action = Action.B;
  name = "Stun";
  help = "If an enemy is about to strike, counter their move";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;
    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 150;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);

    const combatC = ctx.entity.getComponent(CombatC);
    combatC.setState(
      CombatState.Standing,
      spriteC,
      SpriteIndices.BM_STUN_BEFORE
    );
    ctx.ecs.spriteSystem.cowboyUpdate();

    setTimeout(() => {
      // apply stun to enemy
      const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
      ctx.ecs.combatSystem.applyStun(ctx.entity, enemy, ctx.ecs);

      combatC.setState(
        CombatState.Standing,
        spriteC,
        SpriteIndices.BM_STUN_AFTER
      );
      doNext();
    }, 300);

    return true;
  }
}
