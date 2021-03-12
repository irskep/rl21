import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import {
  ensureStandingAndTargetIsAdjacentEnemy,
  ensureStandingAndTargetIsEnemy,
  ensureTargetClear,
} from "./_helpers";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { EnvIndices, SpriteIndices } from "../../assets";
import { DIRECTIONS } from "../direction";
import { isAdjacent, manhattanDistance } from "../../game/tilemap";
import { GroundTakedown } from "./GroundTakedown";

export class FastPunch implements Move {
  action = Action.X;
  name = "Punch";
  help = "Strike the enemy in the face";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    const groundTakedownCheck = new GroundTakedown().check(ctx, target);
    if (groundTakedownCheck.success)
      return { success: false, message: "Conflicts with Ground Takdown" };

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    ctx.ecs.spriteSystem.cowboyUpdate();

    setTimeout(() => {
      const combatC = ctx.entity.getComponent(CombatC);
      combatC.setState(CombatState.PunchFollowthrough, spriteC);

      const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
      const enemySpriteC = enemy.getComponent(SpriteC);
      // face attacker
      enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);
      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        combatC.setState(
          CombatState.Standing,
          spriteC,
          SpriteIndices.BM_PUNCH_AFTER
        );
        ctx.ecs.spriteSystem.cowboyUpdate();

        setTimeout(() => {
          combatC.setState(CombatState.Standing, spriteC);
          ctx.ecs.spriteSystem.cowboyUpdate();
          doNext();
        });
      }, 300);
    }, 300);
    return true;
  }
}

export class LungePunch implements Move {
  action = Action.X;
  name = "Lunge Punch";
  help = "Strike the enemy for 2 hp from 2 tiles away";

  getSpacesBetween(ctx: MoveContext, target: AbstractVector): AbstractVector[] {
    const src = ctx.entity.getComponent(SpriteC).pos;
    const results = new Array<AbstractVector>();
    for (const d of DIRECTIONS) {
      const pos = src.clone().add(d[0]);
      if (!isAdjacent(pos, target)) continue;
      if (!ensureTargetClear(ctx, pos).success) continue;
      if (ctx.ecs.tilemap.getCell(pos)?.index !== EnvIndices.FLOOR) continue;

      const totalManhattan =
        manhattanDistance(src.clone().subtract(pos)) +
        manhattanDistance(target.clone().subtract(pos));
      if (totalManhattan > 3) continue;

      results.push(pos);
    }
    return results;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const checkResult = ensureStandingAndTargetIsEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    if (isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Must be 2 cells away" };
    }

    if (this.getSpacesBetween(ctx, target).length < 1)
      return {
        success: false,
        message: "No clear space",
      };

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const tweenSpace = this.getSpacesBetween(ctx, target)[0];
    spriteC.turnToward(target, tweenSpace);
    ctx.entity
      .getComponent(CombatC)
      .setState(CombatState.PunchTelegraph, spriteC);
    ctx.ecs.spriteSystem.cowboyUpdate();

    setTimeout(() => {
      const combatC = ctx.entity.getComponent(CombatC);
      combatC.setState(CombatState.PunchFollowthrough, spriteC);
      spriteC.pos = tweenSpace;

      const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
      const enemySpriteC = enemy.getComponent(SpriteC);
      // face attacker
      enemySpriteC.orientation = (spriteC.orientation + 2) % 4;
      ctx.ecs.combatSystem.applyPunch(ctx.entity, enemy, ctx.ecs);
      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        combatC.setState(
          CombatState.Standing,
          spriteC,
          SpriteIndices.BM_PUNCH_AFTER
        );
        ctx.ecs.spriteSystem.cowboyUpdate();

        setTimeout(() => {
          combatC.setState(CombatState.Standing, spriteC);
          ctx.ecs.spriteSystem.cowboyUpdate();
          doNext();
        });
      }, 300);
    }, 300);
    return true;
  }
}
