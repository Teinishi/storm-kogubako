import type { LogicalBounds } from '../types';
import { clampToLogicalBounds } from './bounds';

const SNAP_PRECISION = 1_000_000;

export interface PolygonEditorGrid {
  enabled: boolean;
  minorDivisions: number;
}

export function snapPointWithGrid(
  point: Readonly<Vec2>,
  grid: Readonly<PolygonEditorGrid>,
  bounds?: Readonly<LogicalBounds>,
) {
  let p;
  if (!grid.enabled) {
    p = {
      x: roundCoordinate(point.x),
      y: roundCoordinate(point.y),
    };
  } else {
    const step = 1 / Math.max(1, grid.minorDivisions);
    p = {
      x: roundCoordinate(Math.round(point.x / step) * step),
      y: roundCoordinate(Math.round(point.y / step) * step),
    };
  }

  return bounds ? clampToLogicalBounds(p, bounds) : p;
}

function roundCoordinate(value: number) {
  return Math.round(value * SNAP_PRECISION) / SNAP_PRECISION;
}
