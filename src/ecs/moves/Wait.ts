import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";

export class Wait implements Move {
  name = "Wait";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return { success: true };
    } else {
      return { success: false, message: "Must click on yourself" };
    }
  }

  apply(ctx: MoveContext): boolean {
    // Upon waiting, return to normal state
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);

    if (
      combatC.state === CombatState.Prone ||
      combatC.state == CombatState.Stunned
    ) {
      const proneTimer = combatC.recoveryTimer - 1;
      combatC.recoveryTimer = proneTimer;
      spriteC.label = `${proneTimer}`;
      if (proneTimer <= 0) {
        // debugger;
        combatC.setState(
          CombatState.Standing,
          ctx.entity.getComponent(SpriteC)
        );
        ctx.entity.getComponent(SpriteC).label = "";
      }
    } else if (combatC.state != CombatState.Standing) {
      // debugger;
      combatC.setState(CombatState.Standing, ctx.entity.getComponent(SpriteC));
    }

    return false;
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 0;
  }
}
