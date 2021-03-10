import { Sprite } from "pixi.js";
import { AbstractVector, Vector } from "vector2d";
import { EnvIndices } from "../assets";

export class Cell {
  sprite: Sprite | null = null;
  index: number = 0;
  pos: Vector;
  constructor(pos: Vector, index: number) {
    this.index = index;
    this.pos = pos;
  }
}

export class Tilemap {
  contents: Cell[][];
  size: AbstractVector;
  constructor(size: AbstractVector) {
    this.size = size;
    this.contents = new Array(size.y);

    for (let y = 0; y < size.y; y++) {
      this.contents[y] = new Array(size.x);
      for (let x = 0; x < size.x; x++) {
        const pos = new Vector(x, y);
        this.contents[y][x] = new Cell(pos, this.getDefaultIndex(pos));
      }
    }
  }

  getDefaultIndex(pos: Vector) {
    return pos.x === 0 ||
      pos.y === 0 ||
      pos.x === this.size.x - 1 ||
      pos.y === this.size.y - 1
      ? EnvIndices.WALL
      : EnvIndices.FLOOR;
  }

  getCell(pos: AbstractVector): Cell | null {
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.size.x || pos.y >= this.size.y)
      return null;
    return this.contents[pos.y][pos.x];
  }

  getCells(predicate: (cell: Cell) => boolean): Cell[] {
    const cells = new Array<Cell>();

    for (let y = 0; y < this.size.y; y++) {
      for (let x = 0; x < this.size.x; x++) {
        const cell = this.contents[y][x];
        if (predicate(cell)) {
          cells.push(cell);
        }
      }
    }

    return cells;
  }
}

export function manhattanDistance(v: AbstractVector): number {
  return Math.abs(v.x) + Math.abs(v.y);
}

export function isAdjacent(a: AbstractVector, b: AbstractVector): boolean {
  if (a.equals(b)) return false;
  return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
}

export function neighbors(a: AbstractVector): AbstractVector[] {
  const val: Vector[] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) continue;
      val.push(new Vector(a.x + i, a.y + j));
    }
  }
  return val;
}
