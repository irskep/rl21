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
      if (ctx.ecs.tilemap.getCell(p)?.index !== EnvIndices.FLOOR) {
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
    const pos = spriteC.pos;

    const path = this.getPathToEnemy(ctx);

    spriteC.turnToward(path[0]);
    combatC.gunCooldown = 3;

    const displays: DisplayObject[] = path.map((p) => {
      const sprite = new Sprite(Game.shared.filmstrips.env[EnvIndices.HOVER]);
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
