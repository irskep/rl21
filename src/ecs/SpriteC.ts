import { Component } from "@nova-engine/ecs";
import { Sprite, Text } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { CombatState, stateToPlayerSpriteIndex } from "./combat/CombatState";
import { DIRECTIONS } from "./direction";

export class SpriteC implements Component {
  pos: AbstractVector = new Vector(0, 0);
  orientation = 0; // clockwise from up
  private _spriteSheet: string = "sprites";
  private _spriteIndex = 0;
  needsTextureReplacement = false;
  private _label = "";
  needsLabelUpdate = false;
  sprite?: Sprite;
  colorSprite?: Sprite;
  tint = 0xffffff;
  // text: Text | null = null;
  stunSprite?: Sprite;
  zIndex = 0;

  isPlayer = false;
  combatState = CombatState.Standing;

  hasColorLayer = false;

  flavorName = ""; // sprites have names too, why not
  flavorDesc = "";

  build(
    flavorName: string,
    flavorDesc: string,
    pos: AbstractVector,
    spriteSheet: string,
    spriteIndex: number
  ): SpriteC {
    this.flavorName = flavorName;
    this.flavorDesc = flavorDesc;
    this.pos = pos;
    this.spriteIndex = spriteIndex;
    this.spriteSheet = spriteSheet;
    return this;
  }

  get spriteIndex(): number {
    return this._spriteIndex;
  }
  set spriteIndex(value: number) {
    this._spriteIndex = value;
    this.needsTextureReplacement = true;
  }

  get spriteSheet(): string {
    return this._spriteSheet;
  }
  set spriteSheet(value: string) {
    this._spriteSheet = value;
    this.needsTextureReplacement = true;
  }

  get label(): string {
    return this._label;
  }
  set label(value: string) {
    this._label = value;
    this.needsLabelUpdate = true;
  }

  get hoverText(): string {
    return this.flavorName + "\n\n" + this.flavorDesc;
  }

  turnToward(target: AbstractVector, from: AbstractVector | null = null) {
    const direction = target.clone().subtract(from || this.pos);
    for (const d2 of DIRECTIONS) {
      if (d2[0].equals(direction)) {
        this.orientation = d2[1];
        break;
      }
    }
    if (this.isPlayer) {
      this.spriteIndex = stateToPlayerSpriteIndex(
        this.combatState,
        this.orientation
      );
    }
  }

  teardown() {
    if (!this.sprite) return;
    this.sprite.parent.removeChild(this.sprite);
  }
}
