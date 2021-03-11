import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteSystem } from "../SpriteS";
import { SpriteC } from "../SpriteC";
import { CombatEventType } from "../combat/CombatS";
import { ensureTargetIsEnemy } from "./_helpers";
import { isAdjacent } from "../../game/tilemap";

export class Atarangs implements Move {
  action = Action.Y;
  name = "Throw Atarang";
  help = "Stun and damage a faraway enemy, up to 3 times per stage.";

  atarangsRemaining = 3;

  getStatusText(): string | null {
    return `Atarangs remaining: ${this.atarangsRemaining}`;
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    if (this.atarangsRemaining <= 0)
      return { success: false, message: "No atarangs remaining" };

    const state = ctx.entity.getComponent(CombatC).state;
    if (state !== CombatState.Standing) {
      return { success: false, message: "Must be standing" };
    }

    const enemyCheck = ensureTargetIsEnemy(ctx, target);
    if (!enemyCheck.success) return enemyCheck;

    if (isAdjacent(ctx.entity.getComponent(SpriteC).pos, target)) {
      return { success: false, message: "Enemy must be far away" };
    }

    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 49;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);

    const enemy = ctx.ecs.spriteSystem.findCombatEntity(target)!;
    const enemySpriteC = enemy.getComponent(SpriteC);
    const enemyCombatC = enemy.getComponent(CombatC);

    ctx.ecs.combatSystem.changeHP(enemy, -2);
    enemyCombatC.becomeStunned(2, enemySpriteC);
    this.atarangsRemaining -= 1;
    ctx.ecs.spriteSystem.cowboyUpdate();
    ctx.ecs.combatSystem.events.emit({
      type: CombatEventType.Punch,
      subject: ctx.entity,
      object: enemy,
    });
    ctx.ecs.writeMessage(
      `${spriteC.flavorName} throws an atarang at ${enemySpriteC.flavorName}, stunning and damaging them!`
    );

    return false;
  }
}
