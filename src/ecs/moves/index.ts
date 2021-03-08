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
import { CombatTrait } from "../CombatC";

export const BM_MOVES: Move[] = [
  new Wait(),
  new Walk(),
  new FastPunch(),
  new Counter(),
  new Stun(),
];

export const HENCHMAN_MOVES: Move[] = [
  new TelegraphedPunchPrepare(),
  new TelegraphedPunchFollowthroughHit(),
  new TelegraphedPunchFollowthroughMiss(),
  new Wait(),
];
