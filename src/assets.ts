import { AbstractVector, Vector } from "vector2d";

export interface Asset {
  name: string;
  url: string;
  cellSize?: AbstractVector;
  isFilmstrip?: boolean;
}

export const SpriteIndices = {
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
  WALL: 1,
  HOVER: 8,
};

export const ALL_ASSETS: Asset[] = [
  { name: "sprites", url: "sprites.png", isFilmstrip: true },
  { name: "env", url: "env.png", isFilmstrip: true },
  {
    name: "heart",
    url: "heart.png",
    isFilmstrip: true,
    cellSize: new Vector(21, 18),
  },
  { name: "stagecomplete", url: "stagecomplete.png" },
  { name: "youlose", url: "youlose.png" },
];
