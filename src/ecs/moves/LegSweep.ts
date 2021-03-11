import { AbstractVector } from "vector2d";
import { Action } from "../../game/input";
import { CombatState } from "../combat/CombatState";
import { CombatC } from "../combat/CombatC";
import { MoveContext, MoveCheckResult, Move } from "./_types";
import { SpriteSystem } from "../SpriteS";
import { SpriteC } from "../SpriteC";
import { DIRECTIONS } from "../direction";
import { Entity } from "@nova-engine/ecs";
import { CombatEventType } from "../combat/CombatS";

export class LegSweep implements Move {
  action = Action.B;
  name = "Leg Sweep";
  help = "Knock adjacent enemies prone. Lose half your HP.";

  private getAdjacentEnemies(
    spriteSystem: SpriteSystem,
    pos: AbstractVector
  ): Entity[] {
    return DIRECTIONS.map((d) => d[0].clone().add(pos))
      .map((p) => spriteSystem.findCombatEntity(p))
      .filter((p) => p !== null)
      .map((p) => p!);
  }

  check(ctx: MoveContext, target: AbstractVector): MoveCheckResult {
    const state = ctx.entity.getComponent(CombatC).state;
    if (state !== CombatState.Standing) {
      return { success: false, message: "Must be standing" };
    }
    if (!ctx.entity.getComponent(SpriteC).pos.equals(target)) {
      return { success: false, message: "Must click on yourself" };
    }
    const adjacentEnemies = this.getAdjacentEnemies(
      ctx.ecs.spriteSystem,
      target
    );
    if (!adjacentEnemies.length) {
      return { success: false, message: "No adjacent enemies" };
    }
    return { success: true };
  }

  computeValue(ctx: MoveContext, target: AbstractVector): number {
    return 49;
  }

  apply(ctx: MoveContext, target: AbstractVector, doNext: () => void): boolean {
    const spriteC = ctx.entity.getComponent(SpriteC);
    const combatC = ctx.entity.getComponent(CombatC);
    const pos = spriteC.pos;
    const adjacentEnemies = this.getAdjacentEnemies(ctx.ecs.spriteSystem, pos);
    const numEnemies = adjacentEnemies.length;
    const numHP = Math.floor(combatC.hp / 2);

    const process = () => {
      if (!adjacentEnemies.length) {
        ctx.ecs.combatSystem.changeHP(ctx.entity, -numHP);
        ctx.ecs.combatSystem.events.emit({
          type: CombatEventType.Punch,
          object: ctx.entity,
        });

        const enemiesString =
          numEnemies === 1 ? "1 enemy" : `${numEnemies} enemies`;
        const hpString = numHP === 1 ? "1 hit point" : `${numHP} hit points`;

        ctx.ecs.writeMessage(
          `${spriteC.flavorName} knocks down ${enemiesString}, but loses ${hpString}!`
        );

        doNext();
        return;
      }

      const enemy = adjacentEnemies.shift()!;
      const enemySpriteC = enemy.getComponent(SpriteC);
      const enemyCombatC = enemy.getComponent(CombatC);
      const enemyPos = enemySpriteC.pos;

      spriteC.turnToward(enemyPos);
      ctx.ecs.combatSystem.changeHP(enemy, -1);
      enemyCombatC.becomeProne(2, enemySpriteC);
      ctx.ecs.spriteSystem.cowboyUpdate();

      ctx.ecs.combatSystem.events.emit({
        type: CombatEventType.Punch,
        subject: ctx.entity,
        object: enemy,
      });

      setTimeout(process, 300);
    };

    setTimeout(process, 0);

    return true;
  }
}
