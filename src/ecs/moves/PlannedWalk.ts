import { AbstractVector } from "vector2d";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { Walk } from "./Walk";

/**
 * Like Walk, but ignores target and goes to a specific place based on a value passed
 * in the constructor.
 */
export class PlannedWalk implements Move {
  name = "PlannedWalk";
  help = "no combat";

  constructor(private realTarget: AbstractVector) {}

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    return new Walk().check(ctx, this.realTarget);
  }

  apply(ctx: MoveContext, target: AbstractVector): boolean {
    return new Walk().apply(ctx, this.realTarget);
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return -1; // should only be used by CreateAndFollowGoal
  }
}
