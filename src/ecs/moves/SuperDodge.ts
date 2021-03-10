import { AbstractVector, Vector } from "vector2d";
import { Action } from "../../game/input";
import { isAdjacent } from "../../game/tilemap";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { ensureTargetIsEnemy } from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../sprite";
import { Entity } from "@nova-engine/ecs";
import { DIRECTIONS } from "../direction";
import { EnvIndices } from "../../assets";

export class SuperDodge implements Move {
  action = Action.X;
  name = "Super Dodge";
  help = "Leap over an enemy to the space behind them";

  extraNeighbors = [
    new Vector(-2, -2),
    new Vector(-1, -2),
    new Vector(0, -2),
    new Vector(1, -2),
    new Vector(2, -2),

    new Vector(-2, 2),
    new Vector(-1, 2),
    new Vector(0, 2),
    new Vector(1, 2),
    new Vector(2, 2),

    new Vector(-2, -1),
    new Vector(-2, 0),
    new Vector(-2, 1),

    new Vector(2, -1),
    new Vector(2, -0),
    new Vector(2, 1),
  ];

  private getLeapedEnemy(pos: AbstractVector, ctx: MoveContext): Entity | null {
    for (const d of DIRECTIONS) {
      const pos2 = pos.clone().add(d[0]);
      if (ensureTargetIsEnemy(ctx, pos2).success) {
        return ctx.ecs.spriteSystem.findCombatEntity(pos2)!;
      }
    }
    return null;
  }

  private getIsTargetAllowed(
    pos: AbstractVector,
    target: AbstractVector
  ): boolean {
    for (const neighbor of this.extraNeighbors) {
      if (pos.clone().add(neighbor).equals(target)) {
        return true;
      }
    }
    return false;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);

    if (!this.getIsTargetAllowed(spriteC.pos, target)) {
      return { success: false, message: "Target must be 2 spaces away" };
    }

    if (isAdjacent(spriteC.pos, target) || spriteC.pos.equals(target)) {
      return { success: false, message: "Must focus behind an enemy" };
    }

    if (combatC.state != CombatState.Standing) {
      return { success: false, message: "Not in the right state" };
    }

    if (ctx.ecs.tilemap.getCell(target)?.index !== EnvIndices.FLOOR) {
      return { success: false, message: "Target is not floor" };
    }

    const leapedEnemy = this.getLeapedEnemy(spriteC.pos, ctx);
    if (!leapedEnemy) {
      return { success: false, message: "No enemy to leap over" };
    }

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const c = ctx.entity.getComponent(SpriteC);
    const posToFace = new Vector(
      Math.floor((c.pos.x + target.x) / 2),
      Math.floor((c.pos.y + target.y) / 2)
    );
    c.turnToward(posToFace);
    c.pos = target;

    ctx.entity.getComponent(CombatC).setState(CombatState.Standing, c);
    return false;
  }
}
