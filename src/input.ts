import { InteractionEvent } from "pixi.js";

export enum Action {
  A = "A", // space, shift+leftclick
  B = "B", // middleclick, shift+rightclick
  X = "X", // leftclick
  Y = "Y", // rightclick
}

export function interpretEvent(e: InteractionEvent): Action | null {
  const mouseEvent = e.data.originalEvent as MouseEvent;
  if (mouseEvent.button === 0) {
    if (mouseEvent.shiftKey) {
      return Action.A;
    } else {
      return Action.X;
    }
  }
  if (mouseEvent.button === 1) {
    return Action.B;
  }
  if (mouseEvent.button === 2) {
    if (mouseEvent.shiftKey) {
      return Action.B;
    } else {
      return Action.Y;
    }
  }
  return null;
}
