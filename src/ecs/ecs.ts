import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { EnvIndices, SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem } from "./SpriteS";
import { SpriteC } from "./SpriteC";
import { GameInterface } from "../types";
import { Vector } from "vector2d";
import { ECS } from "./ecsTypes";
import { makePlayerMoves, HENCHMAN_MOVES, TITAN_MOVES } from "./moves";
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
import { ItemC } from "./ItemC";

function makeEntity(): Entity {
  const e = new Entity();
  e.id = getID();
  return e;
}

function makePlayer(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    "Atman",
    "The caped crusader",
    pos,
    "sprites",
    SpriteIndices.BM_STAND
  );
  e.getComponent(SpriteC).orientation = orientation;
  e.putComponent(CombatC).build(10, makePlayerMoves(), []);
  e.getComponent(CombatC).isPlayer = true;

  return e;
}

function makeThug(pos: Vector, orientation: number): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    `${getHenchmanName()} (Thug)`,
    "A henchman of average strength and ill health.",
    pos,
    "sprites",
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
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} (Armored Thug)`;
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
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} (Titan Thug)`;
  e.getComponent(SpriteC).flavorDesc = "A henchman of immense strength.";
  return e;
}

function makeGun(pos: Vector): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    "Gun",
    "Henchmen can use it to shoot you. You can't use guns because Atman doesn't kill people; he only grievously injures them.",
    pos,
    "env",
    EnvIndices.GUN
  );
  e.getComponent(SpriteC).flavorName = "Gun";
  e.putComponent(ItemC);
  console.log("Gun at", pos);
  return e;
}

function generateMap(tilemap: Tilemap, rng: RNG): Vector[] {
  const skipSize = 5;
  let availableCells = new Array<Vector>();

  let needsUpdate = true;
  while (needsUpdate) {
    availableCells = new Array<Vector>();
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
      let numFreeNeighbors = 0;
      for (const adjacentPos of getNeighbors(pos)) {
        if (tilemap.getCell(adjacentPos)?.index === EnvIndices.FLOOR) {
          numFreeNeighbors += 1;
        }
      }
      if (numFreeNeighbors < 2) {
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
  const rng = new RNG(`${Date.now()}`);
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

  if (difficulty.numThugs !== 0) {
    const numThugs = rng.int(
      difficulty.numThugs[0],
      difficulty.numThugs[1] + 1
    );
    console.log(difficulty, numThugs);
    for (let i = 0; i < numThugs; i++) {
      engine.addEntity(
        makeThug(availableCells.shift()!, rng.choice(orientations))
      );
    }
  }

  if (difficulty.numArmoredThugs !== 0) {
    const numThugs = rng.int(
      difficulty.numArmoredThugs[0],
      difficulty.numArmoredThugs[1] + 1
    );
    for (let i = 0; i < numThugs; i++) {
      engine.addEntity(
        makeArmoredThug(availableCells.shift()!, rng.choice(orientations))
      );
    }
  }

  if (difficulty.numTitanThugs !== 0) {
    const numThugs = rng.int(
      difficulty.numTitanThugs[0],
      difficulty.numTitanThugs[1] + 1
    );
    for (let i = 0; i < numThugs; i++) {
      engine.addEntity(
        makeTitanThug(availableCells.shift()!, rng.choice(orientations))
      );
    }
  }

  if (difficulty.numGuns !== 0) {
    const numGuns = rng.int(difficulty.numGuns[0], difficulty.numGuns[1] + 1);
    for (let i = 0; i < numGuns; i++) {
      engine.addEntity(makeGun(availableCells.shift()!));
    }
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
