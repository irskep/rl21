import * as PIXI from "pixi.js";

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
}
