import { Move } from "./_types";
import { Walk } from "./Walk";
import { Wait } from "./Wait";
import {
  TelegraphedPunchPrepare,
  TelegraphedPunchFollowthroughHit,
  TelegraphedPunchFollowthroughMiss,
} from "./TelegraphedPunch";
import { FastPunch } from "./FastPunch";
import { Counter } from "./Counter";
import { Stun } from "./Stun";
import {
  SuperpunchFollowthroughHit,
  SuperpunchFollowthroughMiss,
  SuperpunchPrepare,
} from "./Superpunch";
import { CreateAndFollowGoal } from "./CreateAndFollowGoal";

export const BM_MOVES: Move[] = [
  new Wait(),
  new Walk(),
  new FastPunch(),
  new Counter(),
  new Stun(),
];

export const HENCHMAN_MOVES: Move[] = [
  new CreateAndFollowGoal(),
  new TelegraphedPunchPrepare(),
  new TelegraphedPunchFollowthroughHit(),
  new TelegraphedPunchFollowthroughMiss(),
  new Wait(),
];

export const TITAN_MOVES: Move[] = [
  new CreateAndFollowGoal(),
  new SuperpunchPrepare(),
  new SuperpunchFollowthroughHit(),
  new SuperpunchFollowthroughMiss(),
  new Wait(),
];
