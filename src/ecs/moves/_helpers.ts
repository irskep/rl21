import { AbstractVector } from "vector2d";
import { EnvIndices } from "../../assets";
import { isAdjacent } from "../../game/tilemap";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { SpriteC } from "../SpriteC";
import { MoveContext, MoveCheckResult } from "./_types";

export function ensureTargetClear(
  ctx: MoveContext,
  target: AbstractVector
): MoveCheckResult {
  const cell = ctx.ecs.tilemap.getCell(target);
  if (!cell || cell.isFloor !== true)
    return { success: false, message: "Target is not floor" };
  if (ctx.ecs.spriteSystem.findCombatEntity(target) !== null)
    return { success: false, message: "Target is occupied" };
  return { success: true };
}

export function ensureTargetIsEnemy(
  ctx: MoveContext,
  target: AbstractVector
): MoveCheckResult {
  const cell = ctx.ecs.tilemap.getCell(target);
  if (!cell || cell.isFloor !== true)
    return { success: false, message: "Target is not floor" };
  const targetEntity = ctx.ecs.spriteSystem.findCombatEntity(target);
  if (!targetEntity) {
    return { success: false, message: "Target does not contain an entity" };
  }
  const combatC = targetEntity.getComponent(CombatC);
  if (!combatC || combatC.isPlayer == ctx.entity.getComponent(CombatC).isPlayer)
    return { success: false, message: "Target does not contain enemy" };
  return { success: true };
}

export function ensureTargetExists(
  ctx: MoveContext,
  target: AbstractVector
): MoveCheckResult {
  const cell = ctx.ecs.tilemap.getCell(target);
  if (!cell || cell.isFloor !== true)
    return { success: false, message: "Target is not floor" };
  const targetEntity = ctx.ecs.spriteSystem.findCombatEntity(target);
  if (!targetEntity) {
    return { success: false, message: "Target does not contain an entity" };
  }
  return { success: true };
}

export function ensureStandingAndTargetIsEnemy(
  ctx: MoveContext,
  target: AbstractVector
): MoveCheckResult {
  const combatC = ctx.entity.getComponent(CombatC);
  const spriteC = ctx.entity.getComponent(SpriteC);
  if (combatC.state != CombatState.Standing) {
    return { success: false, message: "Not in the right state" };
  }
  const checkResult = ensureTargetIsEnemy(ctx, target);
  if (!checkResult.success) return checkResult;
  return { success: true };
}

export function ensureStandingAndTargetIsAdjacentEnemy(
  ctx: MoveContext,
  target: AbstractVector
): MoveCheckResult {
  const combatC = ctx.entity.getComponent(CombatC);
  const spriteC = ctx.entity.getComponent(SpriteC);
  if (combatC.state != CombatState.Standing) {
    return { success: false, message: "Not in the right state" };
  }
  const checkResult = ensureTargetIsEnemy(ctx, target);
  if (!checkResult.success) return checkResult;

  if (!isAdjacent(spriteC.pos, target)) {
    return { success: false, message: "Not adjacent" };
  }
  return { success: true };
}
