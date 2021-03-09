import { AbstractVector, Vector } from "vector2d";
import { ECS } from "../ecsTypes";
import AStar from "rot-js/lib/path/astar";
import { EnvIndices } from "../../assets";
import { Entity } from "@nova-engine/ecs";

export function findPath(
  src: AbstractVector,
  dest: AbstractVector,
  ecs: ECS
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
      ecs.combatSystem.tilemap.getCell(vector)?.index === EnvIndices.FLOOR &&
      allowedEntities.indexOf(ecs.spriteSystem.findCombatEntity(vector)) !== -1
    );
  };
  const astar = new AStar(dest.x, dest.y, isFree, { topology: 8 });
  astar.compute(src.x, src.y, (x, y) => results.push(new Vector(x, y)));
  // omit first and last elements in path
  return results.slice(1, results.length - 1);
}
