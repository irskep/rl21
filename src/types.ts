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
  assets: Record<string, Texture[]>;
  tileSize: number;
}
