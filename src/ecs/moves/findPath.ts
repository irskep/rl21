import { AbstractVector, Vector } from "vector2d";
import { ECS } from "../ecsTypes";
import AStar from "rot-js/lib/path/astar";
import { EnvIndices } from "../../assets";
import { Entity } from "@nova-engine/ecs";

export function findPath(
  src: AbstractVector,
  dest: AbstractVector,
  ecs: ECS,
  omitLast: boolean = true
): AbstractVector[] {
  const results = new Array<AbstractVector>();
  const isFree = (x: number, y: number) => {
    const vector = new Vector(x, y);
    const allowedEntities: (Entity | null)[] = [
      null,
      ecs.spriteSystem.findCombatEntity(src),
      ecs.spriteSystem.findCombatEntity(dest),
    ];
    return (
      ecs.combatSystem.tilemap.getCell(vector)?.isFloor &&
      allowedEntities.indexOf(ecs.spriteSystem.findCombatEntity(vector)) !== -1
    );
  };
  const astar = new AStar(dest.x, dest.y, isFree, { topology: 8 });
  astar.compute(src.x, src.y, (x, y) => results.push(new Vector(x, y)));
  if (omitLast) {
    // omit first and last elements in path
    return results.slice(1, results.length - 1);
  } else {
    // omit first element in path
    return results.slice(1, results.length);
  }
}
