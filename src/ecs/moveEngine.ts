import { Entity } from "@nova-engine/ecs";
import { checkMaxIfStatementsInShader } from "pixi.js";
import { Vector } from "vector2d";
import { EnvIndices } from "../assets";
import { isAdjacent, Tilemap } from "../tilemap";
import { ECS } from "./ecs";
import { SpriteC } from "./sprite";

export interface MoveContext {
  entity: Entity;
  ecs: ECS;
  tilemap: Tilemap;
}

export interface Move {
  name: string;
  help: string;
  check: (ctx: MoveContext, target: Vector) => MoveCheckResult;
  apply: (ctx: MoveContext, target: Vector) => void;
}

export interface MoveCheckResult {
  success: boolean;
  message?: string;
}

function ensureTargetClear(ctx: MoveContext, target: Vector): MoveCheckResult {
  if (ctx.tilemap.getCell(target).index !== EnvIndices.FLOOR)
    return { success: false, message: "Target is not floor" };
  if (ctx.ecs.spriteSystem.findEntity(target) !== null)
    return { success: false, message: "Target is occupied" };
  return { success: true };
}

class Dodge implements Move {
  name = "Dodge";
  help = "left click";
  check(ctx: MoveContext, target: Vector): MoveCheckResult {
    const checkResult = ensureTargetClear(ctx, target);
    if (!checkResult.success) return checkResult;

    if (!isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Not adjacent" };
    }

    return { success: true };
  }

  apply(ctx: MoveContext, target: Vector) {
    const c = ctx.entity.getComponent(SpriteC);
    c.pos = target;
  }
}

export const ALL_MOVES: Move[] = [new Dodge()];
