import { AbstractVector, Vector } from "vector2d";
import { Tilemap, CellTag } from "../game/tilemap";
import RNG from "../game/RNG";
import { DIRECTIONS, getNeighbors } from "./direction";

function generateOneMap(
  tilemap: Tilemap,
  rng: RNG,
  hasPits: boolean = false
): AbstractVector[] {
  const skipSize = 5;
  let availableCells = new Array<Vector>();

  tilemap.updateCells((cell) => (cell.tag = CellTag.Floor)); // reset everything

  for (let skipX = 0; skipX + skipSize <= tilemap.size.x; skipX += skipSize) {
    for (let skipY = 0; skipY + skipSize <= tilemap.size.y; skipY += skipSize) {
      const areaCells = new Array<Vector>();
      for (let x = skipX; x < skipX + skipSize; x++) {
        for (let y = skipY; y < skipY + skipSize; y++) {
          const cellPos = new Vector(x, y);
          if (tilemap.getCell(cellPos)?.isFloor) {
            areaCells.push(cellPos);
          }
        }
      }
      rng.shuffle(areaCells);
      for (let i = 0; i < 8; i++) {
        const wallPos = areaCells.shift()!;
        const cell = tilemap.getCell(wallPos)!;
        if (hasPits) {
          cell.tag = rng.choice([CellTag.Wall, CellTag.Wall, CellTag.Pit]);
        } else {
          cell.tag = CellTag.Wall;
        }
      }

      availableCells = availableCells.concat(areaCells);
    }
  }

  return availableCells;
}

export function generateMap(
  tilemap: Tilemap,
  rng: RNG,
  hasPits: boolean = false
): AbstractVector[] {
  let availableCells = new Array<AbstractVector>();

  let needsUpdate = true;
  while (needsUpdate) {
    availableCells = generateOneMap(tilemap, rng, hasPits);

    needsUpdate = false;

    // make sure whole map is visitable
    const visited = new Set<string>();
    visited.add(availableCells[0].toString());
    const horizon = new Array<AbstractVector>(availableCells[0]);
    while (horizon.length) {
      const node = horizon.shift();
      for (const d of DIRECTIONS) {
        const neighbor = node!.clone().add(d[0]);
        const isFloor = tilemap.getCell(neighbor)?.isFloor == true;
        if (isFloor && !visited.has(neighbor.toString())) {
          visited.add(neighbor.toString());
          horizon.push(neighbor);
        }
      }
    }
    if (visited.size < availableCells.length) {
      console.warn("Found unreachable space. Regenerating.");
      needsUpdate = true;
      continue;
    }

    // make sure no dead ends
    for (const pos of availableCells) {
      let numFreeNeighbors = 0;
      for (const adjacentPos of getNeighbors(pos)) {
        if (tilemap.getCell(adjacentPos)?.isFloor) {
          numFreeNeighbors += 1;
        }
      }
      if (numFreeNeighbors < 2) {
        needsUpdate = true;
        for (let y = 0; y < tilemap.size.y; y++) {
          for (let x = 0; x < tilemap.size.x; x++) {
            const cell = tilemap.getCell(new Vector(x, y))!;
            cell.tag = tilemap.getDefaultTag(cell.pos);
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
