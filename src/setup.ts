import * as PIXI from "pixi.js";
export function setup(root: HTMLElement): PIXI.Application {
  const app = new PIXI.Application({
    resizeTo: window,
  });
  root.appendChild(app.view);

  return app;
}
