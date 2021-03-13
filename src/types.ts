import * as PIXI from "pixi.js";
import { Texture } from "pixi.js";

export interface GameScene {
  enter: () => void;
  exit: () => void;
}
export interface GameInterface {
  app: PIXI.Application;
  scenes: GameScene[];
  pushScene: (scene: GameScene) => void;
  popScene: () => void;
  replaceScenes: (scenes: GameScene[]) => void;
  filmstrips: Record<string, Texture[]>;
  images: Record<string, Texture>;
}

export const TILE_SIZE = 32;
