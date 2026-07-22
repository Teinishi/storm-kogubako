import type { LogicalBounds } from '../types';
import { clampToLogicalBounds } from './bounds';

export function createRectangleVertices(
  start: Readonly<Vec2>,
  end: Readonly<Vec2>,
  bounds: Readonly<LogicalBounds>,
) {
  const clampedStart = clampToLogicalBounds(start, bounds);
  const clampedEnd = clampToLogicalBounds(end, bounds);
  const minX = Math.min(clampedStart.x, clampedEnd.x);
  const maxX = Math.max(clampedStart.x, clampedEnd.x);
  const minY = Math.min(clampedStart.y, clampedEnd.y);
  const maxY = Math.max(clampedStart.y, clampedEnd.y);

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ] satisfies Vec2[];
}
