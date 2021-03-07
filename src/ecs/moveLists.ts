import { Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { Action } from "../input";
import { isAdjacent } from "../tilemap";
import { MoveContext, MoveCheckResult, Move } from "./moveTypes";
import { SpriteC } from "./sprite";

function ensureTargetClear(ctx: MoveContext, target: Vector): MoveCheckResult {
  if (ctx.tilemap.getCell(target).index !== EnvIndices.FLOOR)
    return { success: false, message: "Target is not floor" };
  if (ctx.ecs.spriteSystem.findEntity(target) !== null)
    return { success: false, message: "Target is occupied" };
  return { success: true };
}

export class Walk implements Move {
  name = "Walk";
  help = "no combat";
  action = Action.X;

  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const checkResult = ensureTargetClear(ctx, target);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    return { success: true };
  }

  apply(ctx: MoveContext, target: Vector): boolean {
    const c = ctx.entity.getComponent(SpriteC);

    const direction = target.clone().subtract(c.pos);
    for (const d2 of DIRECTIONS) {
      if (d2[0].equals(direction)) {
        c.orientation = d2[1];
        break;
      }
    }
    c.pos = target;

    return true;
  }
}

// export class TelegraphedPunch implements Move {

// }

const DIRECTIONS: [Vector, number][] = [
  [new Vector(0, -1), 0],
  [new Vector(1, -1), 0.5],
  [new Vector(1, 0), 1],
  [new Vector(1, 1), 1.5],
  [new Vector(0, 1), 2],
  [new Vector(-1, 1), 2.5],
  [new Vector(-1, 0), 3],
  [new Vector(-1, -1), 3.5],
];

export const BM_MOVES: Move[] = [new Walk()];
export const HENCHMAN_MOVES: Move[] = [new Walk()];
