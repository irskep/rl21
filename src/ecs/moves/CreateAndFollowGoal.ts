import { AbstractVector } from "vector2d";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { GoalType } from "../Goal";
import { findPath } from "./findPath";
import { PlannedWalk } from "./PlannedWalk";
import { ItemC, ItemType } from "../ItemC";
import { manhattanDistance } from "../../game/tilemap";
// import { isAdjacent } from "../../game/tilemap";

export class CreateAndFollowGoal implements Move {
  name = "CreateAndFollowGoal";
  help = "";

  private populateGoal(ctx: MoveContext) {
    const combatC = ctx.entity.getComponent(CombatC);

    // Always reset goal, even though it's a lot of wasted work

    const gunPos = this.findClosestGunPos(ctx);
    console.log("The closest gun is at", gunPos);
    if (gunPos && this.amIClosestToTheGun(ctx, gunPos)) {
      combatC.goal = {
        type: GoalType.GetGun,
        path: findPath(
          ctx.entity.getComponent(SpriteC).pos,
          gunPos,
          ctx.ecs,
          false
        ),
      };
      return;
    }
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

  private findClosestGunPos(ctx: MoveContext): AbstractVector | null {
    const myPos = ctx.entity.getComponent(SpriteC).pos;
    const guns = ctx.ecs.spriteSystem
      .findInterestingObjects()
      .filter(
        (e) =>
          e.hasComponent(ItemC) && e.getComponent(ItemC).type === ItemType.Gun
      )
      .map((e) => e.getComponent(SpriteC).pos)
      .sort(
        (a, b) =>
          manhattanDistance(a.clone().subtract(myPos)) -
          manhattanDistance(b.clone().subtract(myPos))
      );
    return guns.length ? guns[0] : null;
  }

  private amIClosestToTheGun(
    ctx: MoveContext,
    gunPos: AbstractVector
  ): boolean {
    const myPos = ctx.entity.getComponent(SpriteC).pos;
    const teammatePositions = ctx.ecs.combatSystem.family.entities
      .filter((e) => e.getComponent(CombatC).isPlayer === false)
      .map((e) => e.getComponent(SpriteC).pos)
      .sort(
        (a, b) =>
          manhattanDistance(a.clone().subtract(gunPos)) -
          manhattanDistance(b.clone().subtract(gunPos))
      );
    console.log(myPos, teammatePositions);
    return myPos.equals(teammatePositions[0]);
  }

  private getNextMoveInGoal(ctx: MoveContext, consume: boolean): Move | null {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.goal) {
      switch (combatC.goal.type) {
        case GoalType.HuntPlayer:
        case GoalType.GetGun:
          if (combatC.goal.path.length < 1) return null;
          const move = new PlannedWalk(combatC.goal.path[0]);
          if (consume) {
            combatC.goal.path.shift();
          }
          return move;
          break;
        // default:
        //   throw new UnreachableCaseError(combatC.goal.type);
      }
    }

    return null;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const myPos = ctx.entity.getComponent(SpriteC).pos;
    if (!myPos.equals(target)) {
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
    if (ctx.ecs.spriteSystem.findInterestingObject(myPos) !== null) {
      return {
        success: false,
        message:
          "I am standing on something interesting and I should just pick it up instead of making elaborate plans.",
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
    console.log("Goal:", ctx.entity.getComponent(CombatC).goal);
    const nextMove = this.getNextMoveInGoal(ctx, true);
    console.log("Executing next move in plan:", nextMove);
    if (nextMove) {
      return nextMove.apply(ctx, target, doNext);
    } else {
      return false;
    }
  }
}
