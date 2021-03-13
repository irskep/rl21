import { Entity } from "@nova-engine/ecs";
import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { ECS } from "../ecsTypes";

export interface MoveContext {
  entity: Entity;
  ecs: ECS;
}

export interface Move {
  name: string;
  help: string;
  action?: Action;
  log?: boolean;
  extraNeighbors?: AbstractVector[];
  getStatusText?(ctx: MoveContext): string | null;
  check: (ctx: MoveContext, target: AbstractVector) => MoveCheckResult;
  computeValue?: (ctx: MoveContext, target: AbstractVector) => number;
  // return true if doing async work. if return true, must call doNext().
  apply: (
    ctx: MoveContext,
    target: AbstractVector,
    doNext: () => void
  ) => boolean;
}

export interface MoveCheckResult {
  success: boolean;
  message?: string;
}
