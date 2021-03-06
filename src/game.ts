import * as PIXI from "pixi.js";
import webfontloader from "webfontloader";
import { LevelScene } from "./LevelScene";
import { MenuScene } from "./MenuScene";
import { GameScene, GameInterface } from "./types";

export default class Game implements GameInterface {
  app: PIXI.Application;
  scenes = new Array<GameScene>();
  isFontLoaded = false;

  constructor() {
    let pathname = location.pathname;
    if (pathname[pathname.length - 1] === "/") {
      pathname = pathname.slice(0, pathname.length - 1);
    }

    this.app = new PIXI.Application({
      autoDensity: true,
      resolution: window.devicePixelRatio,
      resizeTo: window,
      // width: window.innerWidth,
      // height: window.innerHeight,
    });
    this.app.loader.baseUrl = `//${location.host}/${pathname}`;

    webfontloader.load({
      google: {
        families: ["Barlow Condensed"],
      },
      active: () => {
        this.isFontLoaded = true;
        this.setup();
      },
    });

    this.app.loader
      .add([{ name: "sprites", url: "sprites.png" }])
      .load(this.setup);

    // window.addEventListener("resize", this.handleResize);
  }

  get scene(): GameScene | null {
    return this.scenes.length ? this.scenes[this.scenes.length - 1] : null;
  }

  setup = () => {
    if (!this.isFontLoaded) return;
    if (this.app.loader.progress < 100) return;

    // this.pushScene(new MenuScene(this));
    this.pushScene(new LevelScene(this));
  };

  teardown() {
    // window.removeEventListener("resize", this.handleResize);
    this.scene?.exit();
  }

  // handleResize = () => {
  //   this.app.renderer.resize(window.innerWidth, window.innerHeight);
  // };

  pushScene(scene: GameScene) {
    this.scene?.exit();
    this.scenes.push(scene);
    scene.enter();
  }

  popScene() {
    if (this.scenes.length > 0) {
      this.scene?.exit();
      this.scenes.pop();
      this.scene?.enter();
    }
  }

  replaceScenes(scenes: GameScene[]) {
    this.scene?.exit();
    this.scenes = scenes;
    this.scene?.enter();
  }
}
