import { AbstractVector } from "vector2d";
import { CombatState } from "../CombatState";
import { CombatC } from "../CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import { GoalType } from "../Goal";
import { findPath } from "./findPath";
import { PlannedWalk } from "./PlannedWalk";
import { isAdjacent } from "../../game/tilemap";

export class CreateAndFollowGoal implements Move {
  name = "CreateAndFollowGoal";
  help = "";

  private populateGoal(ctx: MoveContext) {
    const combatC = ctx.entity.getComponent(CombatC);
    // nullify goal if finished
    // if (combatC.goal) {
    //   if (
    //     combatC.goal.type === GoalType.HuntPlayer &&
    //     (combatC.goal.path.length < 1 ||
    //       !isAdjacent(
    //         combatC.goal.path[combatC.goal.path.length - 1],
    //         ctx.ecs.player.getComponent(SpriteC).pos
    //       ))
    //   ) {
    //     console.log("Nullifying goal on", ctx.entity);
    //     combatC.goal = null;
    //   }
    // }
    // if (combatC.goal) return;
    combatC.goal = {
      type: GoalType.HuntPlayer,
      playerPos: ctx.ecs.player.getComponent(SpriteC).pos,
      path: findPath(
        ctx.entity.getComponent(SpriteC).pos,
        ctx.ecs.player.getComponent(SpriteC).pos,
        ctx.ecs
      ),
    };
    if (combatC.goal.path.length < 1) {
      // couldn't find a path
      combatC.goal = null;
    }
  }

  private getNextMoveInGoal(ctx: MoveContext, consume: boolean): Move | null {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.goal) {
      switch (combatC.goal.type) {
        case GoalType.HuntPlayer:
          if (combatC.goal.path.length < 1) return null;
          const move = new PlannedWalk(combatC.goal.path[0]);
          if (consume) {
            combatC.goal.path.shift();
          }
          return move;
      }
    }

    return null;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (!ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return {
        success: false,
        message: "ExecutePlan discards all targets except self",
      };
    }
    if (ctx.entity.getComponent(CombatC).state !== CombatState.Standing) {
      return {
        success: false,
        message: "Can only execute plan while doing nothing else",
      };
    }
    this.populateGoal(ctx);
    const nextMove = this.getNextMoveInGoal(ctx, false);
    if (nextMove) {
      const nextMoveResult = nextMove.check(ctx, target);
      return nextMoveResult;
    } else {
      return { success: false, message: "No plan has been made" };
    }
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 50;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    this.populateGoal(ctx);
    const nextMove = this.getNextMoveInGoal(ctx, true);
    console.log("Executing next move in plan:", nextMove);
    if (nextMove) {
      return nextMove.apply(ctx, target, doNext);
    } else {
      return false;
    }
  }
}
