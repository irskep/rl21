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
import { Disarm, PickUpGun, ShootGun } from "./Guns";

export function makePlayerMoves(): Move[] {
  return [
    new Wait(),
    new Walk(),
    new FastPunch(),
    new Counter(),
    new Stun(),
    new Disarm(),
  ];
}

export function makeHenchmanMoves(): Move[] {
  return [
    new CreateAndFollowGoal(),
    new PickUpGun(),
    new ShootGun(),
    new TelegraphedPunchPrepare(),
    new TelegraphedPunchFollowthroughHit(),
    new TelegraphedPunchFollowthroughMiss(),
    new Wait(),
  ];
}

export function makeBossMoves(): Move[] {
  return [new ShootGun(), new Wait()];
}

export function makeTitanMoves(): Move[] {
  return [
    new CreateAndFollowGoal(),
    new SuperpunchPrepare(),
    new SuperpunchFollowthroughHit(),
    new SuperpunchFollowthroughMiss(),
    new Wait(),
  ];
}
