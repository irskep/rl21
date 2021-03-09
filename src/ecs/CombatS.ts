import {
  Engine,
  Entity,
  Family,
  FamilyBuilder,
  System,
} from "@nova-engine/ecs";
import { AbstractVector } from "vector2d";
import { EnvIndices } from "../assets";
import { manhattanDistance, Tilemap } from "../game/tilemap";
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
import RNG from "../game/RNG";

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
  AllEnemiesDead = "AllEnemiesDead",
}

export interface CombatEvent {
  type: CombatEventType;
  subject?: Entity;
  object?: Entity;
  value?: number;
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
    const remainingEntities = this.family.entities;
    if (
      remainingEntities.length === 1 &&
      remainingEntities[0].getComponent(CombatC).isPlayer
    ) {
      this.events.emit({
        type: CombatEventType.AllEnemiesDead,
      });

      return; // never say processing is finished, so LevelScene doesn't allow more events
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
      value: amount,
    });
  }

  private needsGroupEnd = false;
  processNextEntity = (): void => {
    this.resolveConflicts();

    if (this.needsGroupEnd) {
      console.groupEnd();
    }
    this.needsGroupEnd = false;

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

    console.group(spriteC.flavorName);
    this.needsGroupEnd = true;

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
      // Add a delay between processing this entity and the next one, unless
      // there are no more, in which case process immediately (which ends the
      // loop)
      if (this.entitiesToProcess.length > 0) {
        setTimeout(this.processNextEntity, 200);
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

  private resolveConflicts() {
    const occupants: Record<string, Entity> = {};
    for (const e of this.family.entities) {
      const pos = e.getComponent(SpriteC).pos;
      const occupant = occupants[pos.toString()];
      if (occupant) {
        console.log("Conflict between", e, "and", occupant);
        this.resolveConflict(e, occupant, pos);
      } else {
        occupants[pos.toString()] = e;
      }
    }
  }

  private resolveConflict(e: Entity, occupant: Entity, pos: AbstractVector) {
    const freeFloorCells = this.tilemap.getCells((cell) => {
      return (
        cell.index === EnvIndices.FLOOR &&
        !SpriteSystem.default.findCombatEntity(cell.pos)
      );
    });
    new RNG(`${Math.random()}`).shuffle(freeFloorCells);

    const spriteC = e.getComponent(SpriteC);
    freeFloorCells.sort((a, b) => {
      return (
        manhattanDistance(a.pos.clone().subtract(spriteC.pos)) -
        manhattanDistance(b.pos.clone().subtract(spriteC.pos))
      );
    });
    if (freeFloorCells.length > 0) {
      spriteC.pos = freeFloorCells[0].pos;
      const occupantName = occupant.getComponent(SpriteC).flavorName;
      this.ecs.writeMessage(
        `${spriteC.flavorName} mysteriously moves due to a bug in the game that caused him to collide with ${occupantName}.`
      );
      SpriteSystem.default.cowboyUpdate();
      return freeFloorCells[0];
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
