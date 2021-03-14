import * as PIXI from "pixi.js";
import { Texture } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import webfontloader from "webfontloader";
import { ALL_ASSETS } from "./assets";
import filmstrip from "./filmstrip";
import { LevelScene } from "./game/LevelScene";
import { MenuScene } from "./MenuScene";
import { GameScene, GameInterface } from "./types";

export default class Game implements GameInterface {
  app: PIXI.Application;
  scenes = new Array<GameScene>();
  isFontLoaded = false;
  filmstrips: Record<string, Texture[]> = {};
  images: Record<string, Texture> = {};

  static shared: Game;

  constructor() {
    let pathname = location.pathname;
    if (pathname[pathname.length - 1] === "/") {
      pathname = pathname.slice(0, pathname.length - 1);
    }

    this.app = new PIXI.Application({
      resolution: window.devicePixelRatio,
      width: 1024,
      height: 768,
    });
    const appEl = document.getElementById("app")!;
    appEl.style.transform = `scale(${1 / window.devicePixelRatio})`;
    appEl.style.width = `${1024 * window.devicePixelRatio}px`;
    appEl.style.height = `${768 * window.devicePixelRatio}px`;
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    this.app.ticker.autoStart = true;
    this.app.loader.baseUrl = "";

    webfontloader.load({
      google: {
        families: ["Barlow Condensed"],
      },
      active: () => {
        this.isFontLoaded = true;
        this.setup();
      },
    });

    this.app.loader.add(ALL_ASSETS.map((asset) => asset)).load(this.setup);

    this.app.view.addEventListener("contextmenu", (e) => e.preventDefault());

    Game.shared = this;

    // window.addEventListener("resize", this.handleResize);
  }

  get scene(): GameScene | null {
    return this.scenes.length ? this.scenes[this.scenes.length - 1] : null;
  }

  setup = () => {
    if (!this.isFontLoaded) return;
    if (this.app.loader.progress < 100) return;

    const loadFilmstrip = (name: string, cellSize: AbstractVector) => {
      const texture = (this.app.loader.resources[name] as any)
        ?.texture as PIXI.Texture;

      return filmstrip(texture, cellSize.x, cellSize.y);
    };

    for (const asset of ALL_ASSETS) {
      if (asset.isFilmstrip) {
        this.filmstrips[asset.name] = loadFilmstrip(asset.name, asset.cellSize);
      } else if (asset.url.endsWith(".png")) {
        this.images[asset.name] = (this.app.loader.resources[asset.name] as any)
          ?.texture as Texture;
      } else {
        console.warn("Unknown asset:", asset);
      }
    }

    if (window.location.hash === "#skipmenu") {
      this.pushScene(new LevelScene(this, 0, []));
      // this.pushScene(new UpgradeScene(this, 0, [], new RNG(`${Date.now()}`)));
    } else {
      this.pushScene(new MenuScene(this));
    }
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
