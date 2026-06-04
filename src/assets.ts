import { AbstractVector, Vector } from "vector2d";

export interface Asset {
  name: string;
  url: string;
  cellSize: AbstractVector;
  isFilmstrip: boolean;
}

const SPRITE_COLS = 32;
const HENCHMAN_BASE_ROW = 0;
const HENCHMAN_OVERLAY_ROW = 1;
const BATMAN_ROW = 2;
const BATMAN_INTERACT_ROW = 3;

const spriteCell = (row: number, col: number): number =>
  row * SPRITE_COLS + col;

const PoseCols = {
  STAND_S: 0,
  STAND_E: 1,
  STAND_N: 2,
  STUMBLE: 3,
  CHARGE: 4,
  DODGE_FORWARD: 5,
  DODGE_BACKWARD: 6,
  DODGING: 7,
  STUNNED: 8,
  STUN_BEFORE: 9,
  STUN_AFTER: 10,
  PRONE: 11,
  DEAD: 12,
  BLOCK: 13,
  PUNCH_BEFORE: 14,
  PUNCH_AFTER: 15,
  PUNCH_MISS: 16,
  SUPER_BEFORE: 17,
  SUPER_AFTER: 18,
  KNIFE_BEFORE: 19,
  KNIFE_AFTER: 20,
  SHOOT_HOLD: 21,
  SHOOT_BEFORE: 22,
  SHOOT_AFTER: 23,
  PICKUP: 24,
  TAKE_WEAPON: 25,
  DISABLE_WEAPON: 26,
  THROW_BEFORE: 27,
  THROW_AFTER: 28,
  CATCH: 29,
  LOSE_WEAPON: 30,
  BOX_FLYING: 31,
};

export const SpriteIndices = {
  STAND: spriteCell(HENCHMAN_BASE_ROW, PoseCols.STAND_S),
  STUNNED: spriteCell(HENCHMAN_BASE_ROW, PoseCols.STUNNED),
  DODGING: spriteCell(HENCHMAN_BASE_ROW, PoseCols.DODGING),
  PUNCH_MISS: spriteCell(HENCHMAN_BASE_ROW, PoseCols.PUNCH_MISS),
  BLOCKING: spriteCell(HENCHMAN_BASE_ROW, PoseCols.BLOCK),
  DEAD: spriteCell(HENCHMAN_BASE_ROW, PoseCols.DEAD),
  PUNCH_AFTER: spriteCell(HENCHMAN_BASE_ROW, PoseCols.PUNCH_AFTER),
  PUNCH_BEFORE: spriteCell(HENCHMAN_BASE_ROW, PoseCols.PUNCH_BEFORE),
  PRONE: spriteCell(HENCHMAN_BASE_ROW, PoseCols.PRONE),

  SHOOT_HOLD: spriteCell(HENCHMAN_BASE_ROW, PoseCols.SHOOT_HOLD),
  SHOOT_BEFORE: spriteCell(HENCHMAN_BASE_ROW, PoseCols.SHOOT_BEFORE),
  SHOOT_AFTER: spriteCell(HENCHMAN_BASE_ROW, PoseCols.SHOOT_AFTER),

  SUPERPUNCH_AFTER: spriteCell(HENCHMAN_BASE_ROW, PoseCols.SUPER_AFTER),
  SUPERPUNCH_BEFORE: spriteCell(HENCHMAN_BASE_ROW, PoseCols.SUPER_BEFORE),

  BM_STUN_AFTER: spriteCell(BATMAN_ROW, PoseCols.STUN_AFTER),
  BM_STUN_BEFORE: spriteCell(BATMAN_ROW, PoseCols.STUN_BEFORE),
  BM_PUNCH_BEFORE: spriteCell(BATMAN_ROW, PoseCols.PUNCH_BEFORE),
  BM_PUNCH_AFTER: spriteCell(BATMAN_ROW, PoseCols.PUNCH_AFTER),
  BM_THROW_BEFORE: spriteCell(BATMAN_INTERACT_ROW, PoseCols.THROW_BEFORE),
  BM_THROW_AFTER: spriteCell(BATMAN_INTERACT_ROW, PoseCols.THROW_AFTER),
  BM_STAND_S: spriteCell(BATMAN_ROW, PoseCols.STAND_S),
  BM_STUNNED: spriteCell(BATMAN_ROW, PoseCols.STUNNED),
  BM_STAND_E: spriteCell(BATMAN_ROW, PoseCols.STAND_E),
  BM_STAND_N: spriteCell(BATMAN_ROW, PoseCols.STAND_N),
  BM_TAKING_WEAPON: spriteCell(BATMAN_INTERACT_ROW, PoseCols.TAKE_WEAPON),
  BM_DISABLING_WEAPON: spriteCell(
    BATMAN_INTERACT_ROW,
    PoseCols.DISABLE_WEAPON
  ),
  BM_DEAD: spriteCell(BATMAN_ROW, PoseCols.DEAD),
};

export const SpriteColorOverlays: Record<number, number> = {
  [SpriteIndices.STAND]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.STAND_S),
  [SpriteIndices.STUNNED]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.STUNNED),
  [SpriteIndices.DODGING]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.DODGING),
  [SpriteIndices.PUNCH_MISS]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.PUNCH_MISS
  ),
  [SpriteIndices.BLOCKING]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.BLOCK),
  [SpriteIndices.DEAD]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.DEAD),
  [SpriteIndices.PUNCH_AFTER]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.PUNCH_AFTER
  ),
  [SpriteIndices.PUNCH_BEFORE]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.PUNCH_BEFORE
  ),
  [SpriteIndices.PRONE]: spriteCell(HENCHMAN_OVERLAY_ROW, PoseCols.PRONE),
  [SpriteIndices.SHOOT_HOLD]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.SHOOT_HOLD
  ),
  [SpriteIndices.SHOOT_BEFORE]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.SHOOT_BEFORE
  ),
  [SpriteIndices.SHOOT_AFTER]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.SHOOT_AFTER
  ),
  [SpriteIndices.SUPERPUNCH_AFTER]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.SUPER_AFTER
  ),
  [SpriteIndices.SUPERPUNCH_BEFORE]: spriteCell(
    HENCHMAN_OVERLAY_ROW,
    PoseCols.SUPER_BEFORE
  ),
};

export const getSpriteColorOverlay = (spriteIndex: number): number | null =>
  SpriteColorOverlays[spriteIndex] ?? null;

export const getSpriteDisplayScale = (spriteSheet: string): number =>
  spriteSheet === "sprites" ? 2 : 1;

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
  DOOR: 32,
  PIT: 4,
  HOVER: 8,
  BOX: 56,
  GUN: 20 * 2 + 10 + 6,
};

const noSize = new Vector(-1, -1);

export const ALL_ASSETS: Asset[] = [
  {
    name: "sprites",
    url: "sprites_hybrid.png",
    isFilmstrip: true,
    cellSize: new Vector(16, 16),
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
    name: "blocked",
    url: "blocked.png",
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
  {
    name: "title",
    url: "title.png",
    isFilmstrip: false,
    cellSize: noSize,
  },
];
