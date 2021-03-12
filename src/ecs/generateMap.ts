import { EnvIndices } from "../assets";
import { Vector } from "vector2d";
import { Tilemap, CellTag } from "../game/tilemap";
import RNG from "../game/RNG";
import { getNeighbors } from "./direction";

export function generateMap(tilemap: Tilemap, rng: RNG): Vector[] {
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
            if (tilemap.getCell(cellPos)?.isFloor) {
              areaCells.push(cellPos);
            }
          }
        }
        rng.shuffle(areaCells);
        for (let i = 0; i < 8; i++) {
          const wallPos = areaCells.shift()!;
          const cell = tilemap.getCell(wallPos)!;
          cell.tag = CellTag.Wall;
        }

        availableCells = availableCells.concat(areaCells);
      }
    }

    needsUpdate = false;
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
