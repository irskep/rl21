export interface Asset {
  name: string;
  url: string;
}

export const SpriteIndices = {
  BM_STAND: 0,
};

export const EnvIndices = {
  FLOOR: 0,
  WALL: 1,
  HOVER: 17,
};

export const ALL_ASSETS: Asset[] = [
  { name: "sprites", url: "sprites.png" },
  { name: "env", url: "env.png" },
];
