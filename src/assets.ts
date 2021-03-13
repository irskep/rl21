import { AbstractVector, Vector } from "vector2d";

export interface Asset {
  name: string;
  url: string;
  cellSize: AbstractVector;
  isFilmstrip: boolean;
}

const bmStart = 26;
export const SpriteIndices = {
  STAND: 0,
  STUNNED: 2,
  DODGING: 4,
  PUNCH_MISS: 6,
  BLOCKING: 8,
  DEAD: 10,
  PUNCH_AFTER: 12,
  PUNCH_BEFORE: 14,
  PRONE: 18,

  SHOOT_HOLD: 24,
  SHOOT_BEFORE: 20,
  SHOOT_AFTER: 22,

  SUPERPUNCH_AFTER: 12,
  SUPERPUNCH_BEFORE: 14,

  BM_STUN_AFTER: bmStart + 0,
  BM_STUN_BEFORE: bmStart + 0,
  BM_PUNCH_BEFORE: bmStart + 1,
  BM_PUNCH_AFTER: bmStart + 2,
  // BM_THROW_BEFORE: bmStart + 3,
  // BM_THROW_AFTER: bmStart + 4,
  BM_STAND_S: bmStart + 5,
  BM_STUNNED: bmStart + 6,
  BM_STAND_E: bmStart + 7,
  BM_STAND_N: bmStart + 8,
  BM_TAKING_WEAPON: bmStart + 0,
  BM_DISABLING_WEAPON: bmStart + 0,
  BM_DEAD: bmStart + 0,
};

export const SpriteIndicesOld = {
  STAND: 0,
  STUMBLING: 1,
  STUNNED: 2,
  CHARGING: 3,
  DODGE_FORWARD: 4,
  PRONE: 8,
  DEAD: 9,
  DODGING: 10,
  BLOCKING: 11,
  PUNCH_BEFORE: 16,
  PUNCH_AFTER: 17,
  KNIFE_BEFORE: 18,
  KNIFE_AFTER: 19,
  SHOOT_BEFORE: 24,
  SHOOT_AFTER: 25,
  SUPERPUNCH_BEFORE: 26,
  SUPERPUNCH_AFTER: 27,
  PICKING_UP: 32,
  THROW_BEFORE: 33,
  THROW_AFTER: 34,
  BOX_FLYING: 35,
  LOSING_WEAPON: 36,

  BM_STAND: 40,
  BM_STUN_AFTER: 41,
  BM_STUN_BEFORE: 42,
  BM_DODGE_FORWARD: 43,
  BM_THROW_BEFORE: 44,
  BM_THROW_AFTER: 45,
  BM_PUNCH_BEFORE: 46,
  BM_PUNCH_AFTER: 47,
  BM_CATCH: 48,
  BM_TAKING_WEAPON: 49,
  BM_DISABLING_WEAPON: 50,
  BM_PICKING_UP: 51,
  BM_DODGE_BACKWARD: 52,
  BM_DEAD: 53,
};

export const EnvIndices = {
  FLOOR: 0,
  WALL: 34,
  DOOR: 35,
  PIT: 4,
  HOVER: 8,
  BOX: 56,
  GUN: 20 * 2 + 10 + 6,
};

const noSize = new Vector(-1, -1);

export const ALL_ASSETS: Asset[] = [
  {
    name: "sprites",
    url: "lizsprites.png",
    isFilmstrip: true,
    cellSize: new Vector(32, 32),
  },
  {
    name: "env",
    url: "lizenv.png",
    isFilmstrip: true,
    cellSize: new Vector(32, 32),
  },
  {
    name: "stuns",
    url: "stuns.png",
    isFilmstrip: true,
    cellSize: new Vector(32, 32),
  },
  {
    name: "walls",
    url: "walls.png",
    isFilmstrip: true,
    cellSize: new Vector(24, 40),
  },
  {
    name: "hover",
    url: "hover.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  {
    name: "heart",
    url: "heart.png",
    isFilmstrip: true,
    cellSize: new Vector(21, 18),
  },
  {
    name: "input",
    url: "input.png",
    isFilmstrip: true,
    cellSize: new Vector(80, 32),
  },
  {
    name: "-1hp",
    url: "-1hp.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  {
    name: "-2hp",
    url: "-2hp.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  {
    name: "stun",
    url: "stun.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  {
    name: "stagecomplete",
    url: "stagecomplete.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  { name: "youlose", url: "youlose.png", isFilmstrip: false, cellSize: noSize },
  {
    name: "instructions",
    url: "instructions.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
];
