import { Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { CombatC } from "./combat";
import { MoveContext, MoveCheckResult } from "./moveTypes";

export function ensureTargetClear(
  ctx: MoveContext,
  target: Vector
): MoveCheckResult {
  if (ctx.tilemap.getCell(target).index !== EnvIndices.FLOOR)
    return { success: false, message: "Target is not floor" };
  if (ctx.ecs.spriteSystem.findEntity(target) !== null)
    return { success: false, message: "Target is occupied" };
  return { success: true };
}

export function ensureTargetIsEnemy(
  ctx: MoveContext,
  target: Vector,
  isPlayer: boolean
): MoveCheckResult {
  if (ctx.tilemap.getCell(target).index !== EnvIndices.FLOOR)
    return { success: false, message: "Target is not floor" };
  const entity = ctx.ecs.spriteSystem.findEntity(target);
  if (!entity) {
    return { success: false, message: "Target does not contain an entity" };
  }
  const combatC = entity.getComponent(CombatC);
  if (!combatC || combatC.isPlayer == isPlayer)
    return { success: false, message: "Target does not contain enemy" };
  return { success: true };
}
