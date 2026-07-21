import type { LogicalBounds } from '../types';

export function clampToLogicalBounds(point: Readonly<Vec2>, bounds: Readonly<LogicalBounds>): Vec2 {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}

export function clampVerticesToLogicalBounds(vertices: DeepReadonly<Vec2[]>, bounds: Readonly<LogicalBounds>) {
  return vertices.map(vertex => clampToLogicalBounds(vertex, bounds));
}

export function isWithinLogicalBounds(point: Readonly<Vec2>, bounds: Readonly<LogicalBounds>) {
  return point.x >= bounds.minX
    && point.x <= bounds.maxX
    && point.y >= bounds.minY
    && point.y <= bounds.maxY;
}
