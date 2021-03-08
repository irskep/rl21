import { Vector } from "vector2d";
import { Action } from "../../input";
import { CombatC, CombatState } from "../combat";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "../sprite";

export class Wait implements Move {
  name = "Wait";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
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

    if (combatC.state === CombatState.Prone) {
      const proneTimer = combatC.proneTimer - 1;
      combatC.proneTimer = proneTimer;
      spriteC.label = `${proneTimer}`;
      if (proneTimer <= 0) {
        combatC.setState(CombatState.Normal, ctx.entity.getComponent(SpriteC));
        ctx.entity.getComponent(SpriteC).label = "";
      }
    } else {
      combatC.setState(CombatState.Normal, ctx.entity.getComponent(SpriteC));
    }

    return false;
  }

  computeValue(ctx: MoveContext, target: Vector): number {
    return 0;
  }
}
