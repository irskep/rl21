import {
  Engine,
  Entity,
  Family,
  FamilyBuilder,
  System,
} from "@nova-engine/ecs";
import { AbstractVector } from "vector2d";
import { EnvIndices } from "../assets";
import { Tilemap } from "../tilemap";
import { GameInterface } from "../types";
import { getNeighbors } from "./direction";
import { ECS } from "./ecsTypes";
import { Move } from "./moves/_types";
import { SpriteC, SpriteSystem } from "./sprite";
import UnreachableCaseError from "../UnreachableCaseError";
import { CombatC } from "./CombatC";
import { CombatTrait } from "./CombatTrait";
import { CombatState } from "./CombatState";
import KefirBus from "../KefirBus";
import { STATS } from "./stats";

/**
 * These are visual events that can occur.
 */
export enum CombatEventType {
  HPChanged = "HPChanged",
  BlockedPunch = "BlockedPunch",
  Punch = "Punch",
  Superpunch = "Superpunch",
  Counter = "Counter",
  Stun = "Stun",
  Die = "Die",
}

export interface CombatEvent {
  type: CombatEventType;
  subject?: Entity;
  object?: Entity;
}

export class CombatSystem extends System {
  family!: Family;
  game: GameInterface;
  isProcessing = false;
  ecs!: ECS;
  tilemap!: Tilemap;

  STUN_TIMER = 2;

  entitiesToProcess: Entity[] = [];
  // LevelScene may set this
  onProcessingFinished: (() => void) | null = null;

  events = new KefirBus<CombatEvent, void>("CombatEvents");

  constructor(game: GameInterface) {
    super();
    this.game = game;
  }

  onAttach(engine: Engine) {
    super.onAttach(engine);
    this.family = new FamilyBuilder(engine)
      .include(CombatC)
      .include(SpriteC)
      .build();
  }

  update(engine: Engine, delta: number) {
    this.isProcessing = true;
    this.entitiesToProcess = new Array<Entity>().concat(this.family.entities);
    this.processNextEntity();
  }

  private cleanupProcessingAndNotify() {
    for (let e of new Array<Entity>().concat(this.family.entities)) {
      const combatC = e.getComponent(CombatC);
      if (combatC.hp > 0) continue;
      this.kill(e);
    }
    if (this.onProcessingFinished) {
      this.onProcessingFinished();
    }
  }

  private kill(e: Entity) {
    const combatC = e.getComponent(CombatC);
    const spriteC = e.getComponent(SpriteC);
    spriteC.teardown();
    this.ecs.writeMessage(
      `${spriteC.flavorName} has had enough and collapses to the floor.`
    );
    this.engines[0].removeEntity(e);
    this.events.emit({
      type: CombatEventType.Die,
      subject: e,
    });
  }

  changeHP(entity: Entity, amount: number) {
    entity.getComponent(CombatC).hp += amount;
    this.events.emit({
      type: CombatEventType.HPChanged,
      subject: entity,
    });
  }

  processNextEntity = (): void => {
    if (this.entitiesToProcess.length < 1) {
      this.isProcessing = false;
      this.cleanupProcessingAndNotify();
      return;
    }

    const entity = this.entitiesToProcess.shift()!;
    const combatC = entity.getComponent(CombatC);
    if (combatC.isPlayer) return this.processNextEntity();
    if (!combatC.needsToMove) return this.processNextEntity();

    combatC.needsToMove = false;

    const spriteC = entity.getComponent(SpriteC);

    const moveContext = { entity, ecs: this.ecs, tilemap: this.tilemap };
    const availableMoves: [Move, AbstractVector][] = [];
    for (let m of combatC.moves) {
      for (let n of getNeighbors(spriteC.pos).concat(spriteC.pos)) {
        if (m.check(moveContext, n).success) {
          availableMoves.push([m, n]);
        }
      }
    }

    if (availableMoves.length < 1) {
      return this.processNextEntity();
    }

    availableMoves.sort((a, b) => {
      return (
        b[0].computeValue!(moveContext, b[1]) -
        a[0].computeValue!(moveContext, a[1])
      );
    });

    const [m, target] = availableMoves[0];
    console.log("Apply", m, "from", entity, "to", target);
    const isAsync = m.apply(moveContext, target, this.processNextEntity);
    // if stack growth becomes a problem, this function can be refactored to use
    // a while loop instead of recursion.
    if (!isAsync) {
      SpriteSystem.default.cowboyUpdate();
      if (this.entitiesToProcess.length > 0) {
        setTimeout(this.processNextEntity, 300);
      } else {
        this.processNextEntity();
      }
    }
  };

  reset(engine: Engine) {
    for (let entity of this.family.entities) {
      entity.getComponent(CombatC).needsToMove = true;
    }
  }

  applyPunch(attacker: Entity, defender: Entity, ecs: ECS) {
    const defenderCombatC = defender.getComponent(CombatC);
    const attackerName = attacker.getComponent(SpriteC).flavorName;
    const defenderName = defender.getComponent(SpriteC).flavorName;
    const state = defenderCombatC.state;

    const landPunch = () => {
      switch (defenderCombatC.state) {
        case CombatState.Stunned:
        case CombatState.Prone:
          // don't change state; enemy remains stunned
          defenderCombatC.needsToMove = false;
          this.changeHP(defender, -STATS.PUNCH_DAMAGE);
          this.events.emit({
            type: CombatEventType.Punch,
            subject: attacker,
            object: defender,
          });
          ecs.writeMessage(`${attackerName} lands a punch on ${defenderName}!`);
          break;
        case CombatState.SuperpunchTelegraph:
          this.events.emit({
            type: CombatEventType.Punch,
            subject: attacker,
            object: defender,
          });
          this.changeHP(defender, -STATS.PUNCH_DAMAGE);
          ecs.writeMessage(
            `${attackerName} lands a punch on ${defenderName}, but they are unfazed.`
          );
          break;
        default:
          this.events.emit({
            type: CombatEventType.Punch,
            subject: attacker,
            object: defender,
          });
          defenderCombatC.setState(
            CombatState.Punched,
            defender.getComponent(SpriteC)
          );
          this.changeHP(defender, -STATS.PUNCH_DAMAGE);
          ecs.writeMessage(`${attackerName} lands a punch on ${defenderName}!`);
          break;
      }
    };
    switch (state) {
      case CombatState.Stunned:
        landPunch();
        defenderCombatC.recoveryTimer = this.STUN_TIMER; // reset
        defenderCombatC.updateText(defender.getComponent(SpriteC));
        break;
      case CombatState.Punched:
      case CombatState.Prone:
        landPunch();
        break;
      case CombatState.Standing:
      case CombatState.PunchTelegraph:
      case CombatState.PunchFollowthrough:
      case CombatState.SuperpunchTelegraph:
      case CombatState.SuperpunchFollowthrough:
        if (defenderCombatC.hasTrait(CombatTrait.Armored)) {
          this.events.emit({
            type: CombatEventType.Punch,
            subject: attacker,
            object: defender,
          });
          ecs.writeMessage(
            `${attackerName} tries to punch ${defenderName}, but armor blocks the punch.`
          );
        } else {
          landPunch();
        }
        break;
      default:
        throw new UnreachableCaseError(state);
    }
  }

  applyStun(attacker: Entity, defender: Entity, ecs: ECS) {
    const defenderCombatC = defender.getComponent(CombatC);
    const attackerName = attacker.getComponent(SpriteC).flavorName;
    const defenderName = defender.getComponent(SpriteC).flavorName;
    const state = defenderCombatC.state;
    switch (state) {
      case CombatState.Standing:
      case CombatState.PunchTelegraph:
      case CombatState.PunchFollowthrough:
      case CombatState.Prone:
      case CombatState.Punched:
      case CombatState.Stunned:
        this.events.emit({
          type: CombatEventType.Stun,
          subject: attacker,
          object: defender,
        });
        defenderCombatC.becomeStunned(
          this.STUN_TIMER,
          defender.getComponent(SpriteC)
        );
        ecs.writeMessage(`${attackerName} stuns ${defenderName}!`);
        break;
      case CombatState.SuperpunchTelegraph:
      case CombatState.SuperpunchFollowthrough:
        ecs.writeMessage(`${attackerName} fails to stun ${defenderName}!`);
        break;
      default:
        throw new UnreachableCaseError(state);
    }
  }

  /// Move defender away from attacker, assuming they are adjacent
  push(attacker: Entity, defender: Entity, ecs: ECS, n: number = 1): boolean {
    const posA = attacker.getComponent(SpriteC).pos;
    const defenderSpriteC = defender.getComponent(SpriteC);
    const posD = defenderSpriteC.pos;
    const delta = posD.clone().subtract(posA);

    let didPush = false;

    let newPosD = posD;
    newPosD = newPosD.clone().add(delta);
    let i = 0;
    while (ecs.tilemap.getCell(newPosD)?.index === EnvIndices.FLOOR && i < n) {
      didPush = true;
      i += 1;
      defenderSpriteC.pos = newPosD;
    }
    return didPush;
  }
}
