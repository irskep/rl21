import {
  Engine,
  Entity,
  Family,
  FamilyBuilder,
  System,
} from "@nova-engine/ecs";
import { AbstractVector } from "vector2d";
import { EnvIndices } from "../../assets";
import { CellTag, manhattanDistance, Tilemap } from "../../game/tilemap";
import { GameInterface } from "../../types";
import { DIRECTIONS, getNeighbors } from "../direction";
import { ECS } from "../ecsTypes";
import { Move } from "../moves/_types";
import { SpriteSystem } from "../SpriteS";
import { SpriteC } from "../SpriteC";
import UnreachableCaseError from "../../UnreachableCaseError";
import { CombatC } from "./CombatC";
import { CombatTrait } from "./CombatTrait";
import { CombatState } from "./CombatState";
import KefirBus from "../../KefirBus";
import { STATS } from "../stats";
import RNG from "../../game/RNG";
import { makeArmoredThug, makeThug, makeTitanThug } from "../ecs";

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
  BecomeStunned = "BecomeStunned",
  Die = "Die",
  Shoot = "Shoot",
  AllEnemiesDead = "AllEnemiesDead",
  MissedPunch = "MissedPunch",
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

  rng = new RNG(`${Date.now()}`);

  STUN_TIMER_NORMAL = 1;
  STUN_TIMER_ARMORED = 2;

  SPAWN_TIMER_START = 8;
  spawnTimer = 12;

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
    this.checkForDeadEnemies();
    this.entitiesToProcess = new Array<Entity>().concat(this.family.entities);
    this.processNextEntity();
  }

  checkForDeadEnemies() {
    for (let e of new Array<Entity>().concat(this.family.entities)) {
      const combatC = e.getComponent(CombatC);
      if (combatC.hp > 0) continue;
      this.kill(e);
    }
  }

  private cleanupProcessingAndNotify() {
    this.checkForDeadEnemies();
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

    // prevent player from being infinitely stunned
    const playerCombatC = this.ecs.player.getComponent(CombatC);
    if (
      playerCombatC.state === CombatState.Stunned ||
      playerCombatC.state === CombatState.Prone
    ) {
      playerCombatC.numTurnsStunned += 1;
      console.log("Player is stunned", playerCombatC.numTurnsStunned);

      if (playerCombatC.numTurnsStunned >= 3) {
        const playerSpriteC = this.ecs.player.getComponent(SpriteC);
        playerCombatC.recoveryTimer = 0;
        playerSpriteC.label = "";
        this.ecs.writeMessage(
          `${playerSpriteC.flavorName} shakes it off and stands up.`
        );
        playerCombatC.setState(CombatState.Standing, playerSpriteC);
        this.ecs.spriteSystem.cowboyUpdate();
      }
    } else {
      playerCombatC.numTurnsStunned = 0;
    }

    // boss fight: spawn
    this.spawnTimer -= 1;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.SPAWN_TIMER_START;
      const doors = this.tilemap.getCells((c) => c.tag === CellTag.Door);
      if (doors.length) {
        const door = this.rng.choice(doors);
        for (const d of DIRECTIONS) {
          const neighborPos = d[0].clone().add(door.pos);
          const neighborCell = this.tilemap.getCell(neighborPos);
          if (!neighborCell || neighborCell.isFloor !== true) {
            continue;
          }
          if (this.ecs.spriteSystem.findCombatEntity(neighborPos)) {
            continue;
          }
          switch (this.rng.choice([0, 0, 1, 2])) {
            case 0:
              this.ecs.engine.addEntity(makeThug(neighborPos, 0));
              break;
            case 1:
              this.ecs.engine.addEntity(makeArmoredThug(neighborPos, 0));
              break;
            case 2:
              this.ecs.engine.addEntity(makeTitanThug(neighborPos, 0));
              break;
          }
        }
      }
    }

    if (this.onProcessingFinished) {
      this.onProcessingFinished();
    }
  }

  private kill(e: Entity) {
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

    combatC.gunCooldown = Math.max(0, combatC.gunCooldown - 1);
    combatC.legSweepCooldown = Math.max(0, combatC.legSweepCooldown - 1);

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
      if (this.entitiesToProcess.length > 0 && m.name !== "Wait") {
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
      return cell.isFloor && !SpriteSystem.default.findCombatEntity(cell.pos);
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

  applyPunch(
    attacker: Entity,
    defender: Entity,
    ecs: ECS,
    amt: number = STATS.PUNCH_DAMAGE
  ) {
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
          this.changeHP(defender, -amt);
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
          this.changeHP(defender, -amt);
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
          this.changeHP(defender, -amt);
          if (this.rng.choice([0, 0, 1]) === 0) {
            ecs.writeMessage(
              `${attackerName} lands a punch on ${defenderName}! ${defenderName} remains alert. (33% chance to stun failed.)`
            );
          } else {
            defenderCombatC.becomeStunned(1, defender.getComponent(SpriteC));
            setTimeout(() => {
              this.events.emit({
                type: CombatEventType.BecomeStunned,
                subject: defender,
              });
            }, 300);
            ecs.writeMessage(
              `${attackerName} lands a punch on ${defenderName}! They are knocked back for 1 turn. (33% chance to stun succeeded.)`
            );
          }
          break;
      }
    };
    switch (state) {
      case CombatState.Stunned:
        landPunch();
        defenderCombatC.updateText(defender.getComponent(SpriteC));
        break;
      // case CombatState.Punched:
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
      // case CombatState.Punched:
      case CombatState.Stunned:
        this.events.emit({
          type: CombatEventType.Stun,
          subject: attacker,
          object: defender,
        });
        defenderCombatC.becomeStunned(
          defenderCombatC.hasTrait(CombatTrait.Armored)
            ? this.STUN_TIMER_ARMORED
            : this.STUN_TIMER_NORMAL,
          defender.getComponent(SpriteC)
        );
        this.events.emit({
          type: CombatEventType.BecomeStunned,
          subject: defender,
        });
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
    while (
      ecs.tilemap.getCell(newPosD)?.isFloor &&
      i < n &&
      ecs.spriteSystem.findCombatEntity(newPosD) === null
    ) {
      didPush = true;
      i += 1;
      defenderSpriteC.pos = newPosD;
    }
    return didPush;
  }
}
