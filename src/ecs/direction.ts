import { Vector } from "vector2d";

export const DIRECTIONS: [Vector, number][] = [
  [new Vector(0, -1), 0],
  [new Vector(1, -1), 0.5],
  [new Vector(1, 0), 1],
  [new Vector(1, 1), 1.5],
  [new Vector(0, 1), 2],
  [new Vector(-1, 1), 2.5],
  [new Vector(-1, 0), 3],
  [new Vector(-1, -1), 3.5],
];

export function getDirectionVector(direction: number): Vector {
  switch (direction) {
    case 0:
      return new Vector(0, -1);
    case 0.5:
      return new Vector(1, -1);
    case 1:
      return new Vector(1, 0);
    case 1.5:
      return new Vector(1, 1);
    case 2:
      return new Vector(0, 1);
    case 2.5:
      return new Vector(-1, 1);
    case 3:
      return new Vector(-1, 0);
    case 3.5:
      return new Vector(-1, -1);
    default:
      return new Vector(0, -1);
  }
}

export function getNeighbors(v: Vector): Vector[] {
  return DIRECTIONS.map((d) => new Vector(v.x, v.y).add(d[0]));
}
