import { AbstractVector } from "vector2d";

export enum GoalType {
  HuntPlayer = "AttackPlayer",
  GetGun = "GetGun",
}
export interface HuntPlayerGoal {
  type: GoalType.HuntPlayer;
  path: AbstractVector[];
  playerPos: AbstractVector;
}
export interface GetGunGoal {
  type: GoalType.GetGun;
  path: AbstractVector[];
}
export type Goal = { type: GoalType } & (HuntPlayerGoal | GetGunGoal);
