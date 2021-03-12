import { Engine, Entity } from "@nova-engine/ecs";
import { Container } from "pixi.js";
import { EnvIndices, SpriteIndices } from "../assets";
import getID from "../getID";
import { SpriteSystem } from "./SpriteS";
import { SpriteC } from "./SpriteC";
import { GameInterface } from "../types";
import { AbstractVector, Vector } from "vector2d";
import { ECS } from "./ecsTypes";
import {
  makePlayerMoves,
  makeHenchmanMoves,
  makeTitanMoves,
  makeBossMoves,
} from "./moves";
import { CombatSystem } from "./combat/CombatS";
import { CombatC } from "./combat/CombatC";
import { CombatTrait } from "./combat/CombatTrait";
import { CellTag, Tilemap } from "../game/tilemap";
import getHenchmanName from "../prose/henchmanName";
import { STATS } from "./stats";
import RNG from "../game/RNG";
import { DIFFICULTIES } from "./difficulties";
import { Upgrade } from "./upgrades";
import { ItemC } from "./ItemC";
import UnreachableCaseError from "../UnreachableCaseError";
import { generateMap } from "./generateMap";

function makeEntity(): Entity {
  const e = new Entity();
  e.id = getID();
  return e;
}

function makePlayer(pos: AbstractVector, orientation: number): Entity {
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

export function makeThug(pos: AbstractVector, orientation: number): Entity {
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
  e.putComponent(CombatC).build(STATS.LOW_HP, makeHenchmanMoves(), [
    CombatTrait.MayUseEquipment,
  ]);
  return e;
}

export function makeArmoredThug(
  pos: AbstractVector,
  orientation: number
): Entity {
  const e = makeThug(pos, orientation);
  e.getComponent(CombatC).traits.push(CombatTrait.Armored);
  e.getComponent(SpriteC).tint = 0xffff66;
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} (Armored Thug)`;
  e.getComponent(SpriteC).flavorDesc =
    "A henchman of average strength, wearing armor that blocks punches.";
  return e;
}

export function makeTitanThug(
  pos: AbstractVector,
  orientation: number
): Entity {
  const e = makeThug(pos, orientation);
  e.getComponent(CombatC).moves = makeTitanMoves();
  e.getComponent(CombatC).hp = STATS.HIGH_HP;
  e.getComponent(CombatC).hpMax = STATS.HIGH_HP;
  e.getComponent(CombatC).removeTrait(CombatTrait.MayUseEquipment);
  e.getComponent(SpriteC).tint = 0xff6666;
  e.getComponent(SpriteC).flavorName = `${getHenchmanName()} (Titan Thug)`;
  e.getComponent(SpriteC).flavorDesc = "A henchman of immense strength.";
  return e;
}

export function makeBoss(pos: AbstractVector, orientation: number): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    "Mr. Yendor",
    "The crime boss you came to defeat.",
    pos,
    "sprites",
    SpriteIndices.STAND
  );
  e.getComponent(SpriteC).orientation = orientation;
  e.getComponent(SpriteC).tint = 0xff88ff;
  e.putComponent(CombatC).build(STATS.BOSS_HP, makeBossMoves(), [
    CombatTrait.WieldingGun,
    CombatTrait.ReloadsSlowly,
    CombatTrait.KillingMeBeatsLevel,
  ]);
  return e;
}

function makeGun(pos: AbstractVector): Entity {
  const e = makeEntity();
  e.putComponent(SpriteC).build(
    "Gun",
    "Henchmen can use it to shoot you. You can't use guns because Atman doesn't kill people; he only grievously injures them.",
    pos,
    "env",
    EnvIndices.GUN
  );
  e.getComponent(SpriteC).flavorName = "Gun";
  e.getComponent(SpriteC).zIndex = -1;
  e.putComponent(ItemC);
  return e;
}

function makePrefab1Map(
  tilemap: Tilemap
): {
  bossPos: AbstractVector;
  playerPos: AbstractVector;
  freeCells: AbstractVector[];
} {
  const plan = [
    "....X....D",
    ".._.X.__X.",
    ".._.X...X.",
    ".._.___.X.",
    "..X._..._.",
    "..X._._._.",
    "..X.___X_.",
    "..X.X...X.",
    ".__..X..X.",
    "D_..XXX...",
  ];
  const freeCells = new Array<AbstractVector>();
  const bossPos = new Vector(5, 5);
  const playerPos = new Vector(0, 8);
  for (let y = 0; y < tilemap.size.y; y++) {
    for (let x = 0; x < tilemap.size.x; x++) {
      const p = new Vector(x, y);
      const cell = tilemap.getCell(p)!;
      switch (plan[y][x]) {
        case "X":
          cell.tag = CellTag.Wall;
          break;
        case "D":
          cell.tag = CellTag.Door;
          break;
        case "_":
          cell.tag = CellTag.Pit;
          break;
        case ".":
          cell.tag = CellTag.Floor;
          if (!p.equals(bossPos) && !p.equals(playerPos)) {
            freeCells.push(p);
          }
          break;
        default:
          throw new Error(`Unknown character: ${plan[y][x]}`);
      }
    }
  }
  return {
    bossPos,
    playerPos,
    freeCells,
  };
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

  const difficulty = DIFFICULTIES[n];
  const orientations = [0, 0.5, 1, 1, 5, 2, 2.5, 3, 3.5];

  let availableCells: AbstractVector[] = [];
  let playerPos: AbstractVector = new Vector(-1, -1);
  let bossPos: AbstractVector = new Vector(-1, -1);
  switch (difficulty.mapgenAlgo) {
    case "basic":
      availableCells = generateMap(tilemap, rng);
      playerPos = availableCells.shift()!;
      break;
    case "prefab1":
      const result = makePrefab1Map(tilemap);
      availableCells = result.freeCells;
      playerPos = result.playerPos;
      bossPos = result.bossPos;
      break;
    default:
      throw new UnreachableCaseError(difficulty.mapgenAlgo);
  }

  const player = makePlayer(playerPos, 0);
  for (const u of upgrades) {
    u.apply(player);
  }
  engine.addEntity(player);

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

  if (difficulty.isBoss) {
    engine.addEntity(makeBoss(bossPos, rng.choice(orientations)));
  }

  const ecs = {
    engine: engine,
    combatSystem: combatSystem,
    spriteSystem: spriteSystem,
    tilemap,
    player,
    rng,
    difficulty,
    addGun: (pos: AbstractVector) => engine.addEntity(makeGun(pos)),
    remove: (e: Entity) => {
      if (e.hasComponent(SpriteC)) {
        const spriteC = e.getComponent(SpriteC);
        if (spriteC.sprite) {
          spriteC.sprite.parent.removeChild(spriteC.sprite);
        }
      }
      engine.removeEntity(e);
    },
    writeMessage,
  };
  combatSystem.ecs = ecs;
  return ecs;
}
