import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { ensureStandingAndTargetIsAdjacentEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { SpriteIndices } from "../../assets";
import { Disarm } from "./Guns";

export class Stun implements Move {
  action = Action.Y;
  name = "Stun";
  help = "If an enemy is about to strike, counter their move";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const disarmResult = new Disarm().check(ctx, target);
    if (disarmResult.success) {
      return { success: false, message: "Disarm instead" };
    }
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;
    if (
      ctx.ecs.spriteSystem.findCombatEntity(target)?.getComponent(CombatC)
        .state === CombatState.Prone
    ) {
      return { success: false, message: "Prone enemies cannot be stunned" };
    }
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
      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        combatC.setState(CombatState.Standing, spriteC);
        ctx.ecs.spriteSystem.cowboyUpdate();

        doNext();
      }, 300);
    }, 300);

    return true;
  }
}
