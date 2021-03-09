import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem, SpriteC } from "./sprite";
import { GameInterface } from "../types";
import { Vector } from "vector2d";
import { ECS } from "./ecsTypes";
import { BM_MOVES, HENCHMAN_MOVES, TITAN_MOVES } from "./moves";
import { CombatSystem } from "./CombatS";
import { CombatC } from "./CombatC";
import { CombatTrait } from "./CombatTrait";
import { Tilemap } from "../game/tilemap";
import getHenchmanName from "../prose/henchmanName";
import { STATS } from "./stats";

function makeEntity(): Entity {
  const e = new Entity();
  e.id = getID();
  return e;
}

function makePlayer(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  // if (e.id != 0) {
  //   throw new Error("player should always be 0");
  // }

  e.putComponent(SpriteC).build(
    "Atman",
    "The caped crusader",
    pos,
    SpriteIndices.BM_STAND
  );
  e.getComponent(SpriteC).orientation = orientation;
  e.putComponent(CombatC).build(10, BM_MOVES, []);
  e.getComponent(CombatC).isPlayer = true;

  return e;
}

function makeThug(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    `${getHenchmanName()} the Thug`,
    "A henchman of average strength and ill health.",
    pos,
    SpriteIndices.STAND
  );
  e.getComponent(SpriteC).orientation = orientation;
  e.getComponent(SpriteC).tint = 0x8888ff;
  e.putComponent(CombatC).build(STATS.LOW_HP, HENCHMAN_MOVES, []);
  return e;
}

function makeArmoredThug(pos: Vector, orientation: number): Entity {
  const e = makeThug(pos, orientation);
  e.getComponent(CombatC).traits.push(CombatTrait.Armored);
  e.getComponent(SpriteC).tint = 0xffff66;
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} the Armored Thug`;
  e.getComponent(SpriteC).flavorDesc =
    "A henchman of average strength, wearing armor that blocks punches.";
  return e;
}

function makeTitanThug(pos: Vector, orientation: number): Entity {
  const e = makeThug(pos, orientation);
  e.getComponent(CombatC).moves = TITAN_MOVES;
  e.getComponent(CombatC).hp = STATS.HIGH_HP;
  e.getComponent(CombatC).hpMax = STATS.HIGH_HP;
  e.getComponent(SpriteC).tint = 0xff6666;
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} the Titan Thug`;
  e.getComponent(SpriteC).flavorDesc = "A henchman of immense strength.";
  return e;
}

export function makeECS(
  game: GameInterface,
  container: Container,
  tilemap: Tilemap,
  writeMessage: (msg: string) => void,
  n: number
): ECS {
  const engine = new Engine();

  const spriteSystem = new SpriteSystem(game, container);
  const combatSystem = new CombatSystem(game);

  engine.addSystems(combatSystem);
  engine.addSystems(spriteSystem);

  const player = makePlayer(
    new Vector(Math.floor(tilemap.size.x / 2), tilemap.size.y - 2),
    0
  );
  engine.addEntity(player);

  engine.addEntity(
    makeThug(new Vector(Math.floor(tilemap.size.x / 2), tilemap.size.y - 5), 2)
  );
  // engine.addEntity(
  //   makeArmoredThug(
  //     new Vector(Math.floor(tilemap.size.x / 2 + 2), tilemap.size.y - 5),
  //     2
  //   )
  // );
  // engine.addEntity(
  //   makeTitanThug(
  //     new Vector(Math.floor(tilemap.size.x / 2 - 2), tilemap.size.y - 5),
  //     2
  //   )
  // );

  const ecs = {
    engine: engine,
    combatSystem: combatSystem,
    spriteSystem: spriteSystem,
    tilemap,
    player,
    writeMessage,
  };
  combatSystem.ecs = ecs;
  return ecs;
}
