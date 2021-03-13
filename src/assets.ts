import { AbstractVector, Vector } from "vector2d";

export interface Asset {
  name: string;
  url: string;
  cellSize: AbstractVector;
  isFilmstrip: boolean;
}

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

  SHOOT_BEFORE: 16,
  SHOOT_AFTER: 16, // replace me

  SUPERPUNCH_BEFORE: 12,
  SUPERPUNCH_AFTER: 14,

  BM_STAND: 20 + 0,
  BM_STUN_AFTER: 20 + 0,
  BM_STUN_BEFORE: 20 + 0,
  BM_THROW_BEFORE: 20 + 0,
  BM_THROW_AFTER: 20 + 0,
  BM_PUNCH_BEFORE: 20 + 0,
  BM_PUNCH_AFTER: 20 + 0,
  BM_TAKING_WEAPON: 20 + 0,
  BM_DISABLING_WEAPON: 20 + 0,
  BM_DEAD: 20 + 0,
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
  DOOR: 2,
  PIT: 4,
  HOVER: 8,
  BOX: 56,
  GUN: 57,
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
    name: "stagecomplete",
    url: "stagecomplete.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
  { name: "youlose", url: "youlose.png", isFilmstrip: false, cellSize: noSize },
];
