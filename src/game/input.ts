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
    if (mouseEvent.shiftKey || mouseEvent.altKey) {
      return Action.A;
    } else {
      return Action.X;
    }
  }
  if (mouseEvent.button === 1) {
    return Action.B;
  }
  if (mouseEvent.button === 2) {
    if (mouseEvent.shiftKey || mouseEvent.altKey) {
      return Action.B;
    } else {
      return Action.Y;
    }
  }
  return null;
}

export function getActionText(action: Action): string {
  switch (action) {
    case Action.A:
      return "Alt + left click";
    case Action.B:
      return "Alt + right click";
    case Action.X:
      return "Left click";
    case Action.Y:
      return "Right click";
  }
}
