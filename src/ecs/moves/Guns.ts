import { AbstractVector, Vector } from "vector2d";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteC } from "../SpriteC";
import { CombatTrait } from "../combat/CombatTrait";
import { BresenhamRasterizer } from "../../bresenham";
import { DisplayObject } from "@pixi/display";
import { Sprite } from "@pixi/sprite";
import { EnvIndices, SpriteIndices } from "../../assets";
import Game from "../../game";
import { CombatEventType } from "../combat/CombatS";
import { ensureStandingAndTargetIsAdjacentEnemy } from "./_helpers";
import { Action } from "../../game/input";
import { CellTag } from "../../game/tilemap";

export class PickUpGun implements Move {
  name = "PickUpGun";
  help = "?";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (!ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return { success: false, message: "Only applies to self" };
    }
    const gun = ctx.ecs.spriteSystem.findInterestingObject(target);
    if (!gun) {
      return { success: false, message: "No gun at this location" };
    }

    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.state !== CombatState.Standing) {
      return { success: false, message: "Must be standing" };
    }

    return { success: true };
  }

  apply(ctx: MoveContext): boolean {
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);
    const pos = spriteC.pos;

    const gun = ctx.ecs.spriteSystem.findInterestingObject(pos)!;
    ctx.ecs.remove(gun);
    combatC.addTrait(CombatTrait.WieldingGun, spriteC);
    ctx.ecs.spriteSystem.cowboyUpdate();

    ctx.ecs.writeMessage(`${spriteC.flavorName} picks up a gun.`);

    return false;
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 300; // henchmen love guns
  }
}

export class ShootGun implements Move {
  name = "ShootGun";
  help = "?";

  getPathToEnemy(ctx: MoveContext): AbstractVector[] {
    const myPos = ctx.entity.getComponent(SpriteC).pos;
    // assume this is AI-only
    const enemyPos = ctx.ecs.player.getComponent(SpriteC).pos;

    let path = new Array<AbstractVector>();

    const bresenham = new BresenhamRasterizer(
      (x, y) => path.push(new Vector(x, y)),
      myPos.x,
      myPos.y,
      enemyPos.x,
      enemyPos.y
    );
    bresenham.rasterizeLine();

    path = path.slice(1, path.length);

    for (const p of path.slice(0, path.length - 1)) {
      if (ctx.ecs.spriteSystem.findCombatEntity(p) !== null) {
        return []; // not empty
      }
      const tag = ctx.ecs.tilemap.getCell(p)?.tag;
      if (tag !== CellTag.Floor && tag !== CellTag.Pit) {
        return []; // tile is wall
      }
    }

    return path;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const combatC = ctx.entity.getComponent(CombatC);
    if (combatC.gunCooldown > 0) {
      return { success: false, message: "Waiting on cooldown" };
    }

    if (!ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return { success: false, message: "Only applies to self" };
    }

    if (combatC.state !== CombatState.Standing) {
      return { success: false, message: "Must be standing" };
    }

    if (!combatC.hasTrait(CombatTrait.WieldingGun)) {
      return { success: false, message: "Does not have a gun" };
    }

    const path = this.getPathToEnemy(ctx);
    if (path.length) {
      return { success: true };
    } else {
      return { success: false, message: "No clear path to enemy" };
    }
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const combatC = ctx.entity.getComponent(CombatC);
    const spriteC = ctx.entity.getComponent(SpriteC);

    const path = this.getPathToEnemy(ctx);

    spriteC.turnToward(path[0]);
    if (combatC.hasTrait(CombatTrait.ReloadsSlowly)) {
      combatC.gunCooldown = 8;
    } else {
      combatC.gunCooldown = 3;
    }

    const displays: DisplayObject[] = path.map((p) => {
      const sprite = new Sprite(Game.shared.images.hover);
      sprite.anchor.set(0.5, 0.5);
      ctx.ecs.spriteSystem.setPosition(sprite, p);
      ctx.ecs.spriteSystem.container.addChild(sprite);
      return sprite;
    });

    setTimeout(() => {
      combatC.setState(
        CombatState.Standing,
        spriteC,
        SpriteIndices.SHOOT_AFTER
      );
      ctx.ecs.combatSystem.events.emit({
        type: CombatEventType.Shoot,
        subject: ctx.entity,
        object: ctx.ecs.player,
      });
      ctx.ecs.combatSystem.changeHP(ctx.ecs.player, -2);

      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        displays.forEach((d) => ctx.ecs.spriteSystem.container.removeChild(d));
        combatC.setState(CombatState.Standing, spriteC);
        ctx.ecs.spriteSystem.cowboyUpdate();

        ctx.ecs.writeMessage(
          `${spriteC.flavorName} shoots ${
            ctx.ecs.player.getComponent(SpriteC).flavorName
          }!`
        );

        doNext();
      });
    }, 500);

    return true;
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 300; // henchmen love guns
  }
}

export class Disarm implements Move {
  action = Action.Y;
  name = "Disarm";
  help = "Take enemy's weapon and break it so no one else can use it";

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (ctx.entity.getComponent(CombatC).state !== CombatState.Standing) {
      return { success: false, message: "Must be standing" };
    }

    const checkResult = ensureStandingAndTargetIsAdjacentEnemy(ctx, target);
    if (!checkResult.success) return checkResult;

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    if (!enemy.getComponent(CombatC).hasTrait(CombatTrait.WieldingGun)) {
      return { success: false, message: "Enemy does not have a weapon" };
    }
    if (enemy.getComponent(CombatC).state !== CombatState.Stunned) {
      return { success: false, message: "Enemy must be stunned" };
    }

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 200;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    spriteC.turnToward(target);
    const combatC = ctx.entity.getComponent(CombatC);
    combatC.setState(
      CombatState.Standing,
      spriteC,
      SpriteIndices.BM_TAKING_WEAPON
    );

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemyCombatC = enemy.getComponent(CombatC);
    const enemySpriteC = enemy.getComponent(SpriteC);
    enemyCombatC.removeTrait(
      CombatTrait.WieldingGun,
      enemy.getComponent(SpriteC)
    );

    ctx.ecs.spriteSystem.cowboyUpdate();

    ctx.ecs.writeMessage(
      `${spriteC.flavorName} breaks ${enemySpriteC.flavorName}'s gun.`
    );

    setTimeout(() => {
      combatC.setState(
        CombatState.Standing,
        spriteC,
        SpriteIndices.BM_DISABLING_WEAPON
      );
      ctx.ecs.spriteSystem.cowboyUpdate();

      setTimeout(() => {
        combatC.setState(CombatState.Standing, spriteC);
        ctx.ecs.spriteSystem.cowboyUpdate();
        doNext();
      }, 300);
    }, 300);

    return true;
  }
}
