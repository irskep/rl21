import { Entity } from "@nova-engine/ecs";
import { Vector } from "vector2d";
import { Action } from "../input";
import { Tilemap } from "../tilemap";
import { ECS } from "./ecsTypes";

export interface MoveContext {
  entity: Entity;
  ecs: ECS;
  tilemap: Tilemap;
}

export interface Move {
  name: string;
  help: string;
  action?: Action;
  check: (ctx: MoveContext, target: Vector) => MoveCheckResult;
  apply: (ctx: MoveContext, target: Vector) => boolean;
}

export interface MoveCheckResult {
  success: boolean;
  message?: string;
}
