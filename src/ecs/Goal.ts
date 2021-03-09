import { AbstractVector } from "vector2d";

export enum GoalType {
  HuntPlayer = "AttackPlayer",
}
export interface HuntPlayerGoal {
  type: GoalType.HuntPlayer;
  path: AbstractVector[];
  playerPos: AbstractVector;
}
export type Goal = HuntPlayerGoal;
