import { Container, DisplayObject, Sprite } from "pixi.js";
import { AbstractVector } from "vector2d";

export interface Animation {
  duration: number;
  timePassed?: number;
  apply: (dt: number, timePassed: number) => void;
  finish: () => void;
}

export class AnimationHandler {
  private animations = new Array<Animation>();

  tick(dtMs: number) {
    const dt = dtMs;
    const nextAnimations = new Array<Animation>();
    for (let animation of this.animations) {
      animation.timePassed = (animation.timePassed || 0) + dt;
      // console.log(animation.timePassed);
      animation.apply(dt, animation.timePassed);
      if (animation.timePassed >= animation.duration) {
        animation.finish();
      } else {
        nextAnimations.push(animation);
      }
    }
    this.animations = nextAnimations;
  }

  add(a: Animation) {
    this.animations.push(a);
  }
}

export function makeDriftAndFadeAnimation(
  obj: DisplayObject,
  duration: number,
  velocity: AbstractVector
): Animation {
  return {
    duration,
    apply: (dt, timePassed) => {
      obj.position.set(
        obj.position.x + dt * velocity.x,
        obj.position.y + dt * velocity.y
      );
      obj.alpha = 1 - timePassed / duration;
    },
    finish: () => {
      obj.parent.removeChild(obj);
    },
  };
}
