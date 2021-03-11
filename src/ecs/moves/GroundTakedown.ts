import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { ensureStandingAndTargetIsAdjacentEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { SpriteIndices } from "../../assets";

export class GroundTakedown implements Move {
  action = Action.X;
  name = "Ground Takedown";
  help =
    "Knock out the target immediately regardless of their remaining hit points.";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemyState = enemy.getComponent(CombatC).state;
    switch (enemyState) {
      case CombatState.Prone:
        return { success: true };
      default:
        return { success: false, message: "Enemy must be prone." };
    }
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
      const enemyCombatC = enemy.getComponent(CombatC);
      enemyCombatC.hp = 0;

      setTimeout(() => {
        spriteC.pos = enemySpriteC.pos;
        combatC.setState(
          CombatState.Standing,
          spriteC,
          SpriteIndices.BM_PUNCH_AFTER
        );
        ctx.ecs.spriteSystem.cowboyUpdate();

        ctx.ecs.writeMessage(
          `${spriteC.flavorName} knocks out ${enemySpriteC.flavorName} while they're down!`
        );

        setTimeout(() => {
          combatC.setState(CombatState.Standing, spriteC);
          ctx.ecs.spriteSystem.cowboyUpdate();
          doNext();
        });
      }, 300);
    }, 300);
    return true;
  }
}
