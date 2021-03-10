import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { EnvIndices, SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem, SpriteC } from "./sprite";
import { GameInterface } from "../types";
import { AbstractVector, Vector } from "vector2d";
import { ECS } from "./ecsTypes";
import { BM_MOVES, HENCHMAN_MOVES, TITAN_MOVES } from "./moves";
import { CombatSystem } from "./combat/CombatS";
import { CombatC } from "./combat/CombatC";
import { CombatTrait } from "./combat/CombatTrait";
import { Tilemap } from "../game/tilemap";
import getHenchmanName from "../prose/henchmanName";
import { STATS } from "./stats";
import RNG from "../game/RNG";
import { DIFFICULTIES } from "./difficulties";
import { getNeighbors } from "./direction";
import { Upgrade } from "./upgrades";

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

function generateMap(tilemap: Tilemap, rng: RNG): Vector[] {
  const skipSize = 5;
  let availableCells = new Array<Vector>();

  let needsUpdate = true;
  while (needsUpdate) {
    for (let skipX = 0; skipX + skipSize <= tilemap.size.x; skipX += skipSize) {
      for (
        let skipY = 0;
        skipY + skipSize <= tilemap.size.y;
        skipY += skipSize
      ) {
        const areaCells = new Array<Vector>();
        for (let x = skipX; x < skipX + skipSize; x++) {
          for (let y = skipY; y < skipY + skipSize; y++) {
            const cellPos = new Vector(x, y);
            if (tilemap.getCell(cellPos)?.index === EnvIndices.FLOOR) {
              areaCells.push(cellPos);
            }
          }
        }
        rng.shuffle(areaCells);
        for (let i = 0; i < 4; i++) {
          const wallPos = areaCells.shift()!;
          const cell = tilemap.getCell(wallPos)!;
          cell.index = EnvIndices.WALL;
        }

        availableCells = availableCells.concat(areaCells);
      }
    }

    needsUpdate = false;
    for (const pos of availableCells) {
      let hasOpening = false;
      for (const adjacentPos of getNeighbors(pos)) {
        if (tilemap.getCell(adjacentPos)?.index === EnvIndices.FLOOR) {
          hasOpening = true;
          break;
        }
      }
      if (!hasOpening) {
        needsUpdate = true;
        for (let y = 0; y < tilemap.size.y; y++) {
          for (let x = 0; x < tilemap.size.x; x++) {
            const cell = tilemap.getCell(new Vector(x, y))!;
            cell.index = tilemap.getDefaultIndex(cell.pos);
          }
        }
        console.warn("Regenerating map due to enclosed space");
        break;
      }
    }
  }
  rng.shuffle(availableCells);
  return availableCells;
}

export function makeECS(
  game: GameInterface,
  container: Container,
  tilemap: Tilemap,
  writeMessage: (msg: string) => void,
  n: number,
  upgrades: Upgrade[]
): ECS {
  const rng = new RNG(`${Math.random()}`);
  console.log("Map RNG seed:", rng.seed);
  const engine = new Engine();

  const spriteSystem = new SpriteSystem(game, container);
  const combatSystem = new CombatSystem(game);

  engine.addSystems(combatSystem);
  engine.addSystems(spriteSystem);

  const availableCells = generateMap(tilemap, rng);

  const player = makePlayer(availableCells.shift()!, 0);
  for (const u of upgrades) {
    u.apply(player);
  }
  engine.addEntity(player);

  const difficulty = DIFFICULTIES[n];
  const orientations = [0, 0.5, 1, 1, 5, 2, 2.5, 3, 3.5];

  for (let i = 0; i < difficulty.numThugs; i++) {
    engine.addEntity(
      makeThug(availableCells.shift()!, rng.choice(orientations))
    );
  }
  for (let i = 0; i < difficulty.numArmoredThugs; i++) {
    engine.addEntity(
      makeArmoredThug(availableCells.shift()!, rng.choice(orientations))
    );
  }
  for (let i = 0; i < difficulty.numTitanThugs; i++) {
    engine.addEntity(
      makeTitanThug(availableCells.shift()!, rng.choice(orientations))
    );
  }

  const ecs = {
    engine: engine,
    combatSystem: combatSystem,
    spriteSystem: spriteSystem,
    tilemap,
    player,
    rng,
    writeMessage,
  };
  combatSystem.ecs = ecs;
  return ecs;
}
