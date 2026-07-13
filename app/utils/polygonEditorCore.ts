export interface PolygonEditorPoint {
  x: number;
  y: number;
}

export interface PolygonEditorPolygon {
  id: number;
  color: string;
  vertices: PolygonEditorPoint[];
}

export interface PolygonEditorGrid {
  enabled: boolean;
  minorDivisions: number;
}

export interface PolygonEditorValue {
  polygons: PolygonEditorPolygon[];
}

export type LogicalBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CanvasMetrics = {
  width: number;
  height: number;
  dpr: number;
  originX: number;
  originY: number;
};

export type HitVertex = {
  polygonId: number;
  vertexIndex: number;
  distance: number;
};

export type HitEdge = {
  polygonId: number;
  edgeIndex: number;
  point: PolygonEditorPoint;
  distance: number;
};

export type ViewTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  logicalWidth: number;
  logicalHeight: number;
};

export type ReadonlyVertex = {
  readonly x: number;
  readonly y: number;
};

export type ReadonlyPolygon = {
  readonly id: number;
  readonly color: string;
  readonly vertices: readonly ReadonlyVertex[];
};

export const GRID_SCALE = 56;
export const HANDLE_HIT_THRESHOLD_PX = 8;
export const SNAP_PRECISION = 1_000_000;
export const VIEW_PADDING = 16;

const POLYGON_COLORS = [
  '#0F766E',
  '#1D4ED8',
  '#7C3AED',
  '#B45309',
  '#DC2626',
  '#059669',
  '#C026D3',
  '#0284C7',
];

let nextPolygonColorIndex = 0;

export function getNextPolygonColor() {
  const color = POLYGON_COLORS[nextPolygonColorIndex % POLYGON_COLORS.length]!;
  nextPolygonColorIndex += 1;
  return color;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampToLogicalBounds(point: PolygonEditorPoint, bounds: LogicalBounds): PolygonEditorPoint {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}

export function clampVerticesToLogicalBounds(vertices: PolygonEditorPoint[], bounds: LogicalBounds) {
  return vertices.map(vertex => clampToLogicalBounds(vertex, bounds));
}

export function isWithinLogicalBounds(point: PolygonEditorPoint, bounds: LogicalBounds) {
  return point.x >= bounds.minX
    && point.x <= bounds.maxX
    && point.y >= bounds.minY
    && point.y <= bounds.maxY;
}

export function clonePoint(point: PolygonEditorPoint): PolygonEditorPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

export function clonePolygon(polygon: PolygonEditorPolygon): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(clonePoint),
  };
}

export function clonePolygonEditorValue(value: PolygonEditorValue): PolygonEditorValue {
  return { polygons: value.polygons.map(clonePolygon) };
}

export function createDefaultPolygonEditorValue(): PolygonEditorValue {
  return { polygons: [] };
}

export function getViewTransform(metrics: CanvasMetrics, bounds: LogicalBounds): ViewTransform {
  const logicalWidth = Math.max(0.000001, bounds.maxX - bounds.minX);
  const logicalHeight = Math.max(0.000001, bounds.maxY - bounds.minY);
  const innerWidth = metrics.width - 2 * VIEW_PADDING;
  const innerHeight = metrics.height - 2 * VIEW_PADDING;
  const scale = Math.min(innerWidth / logicalWidth, innerHeight / logicalHeight);
  const offsetX = (innerWidth - logicalWidth * scale) / 2 - bounds.minX * scale + VIEW_PADDING;
  const offsetY = innerHeight - (innerHeight - logicalHeight * scale) / 2 + bounds.minY * scale + VIEW_PADDING;
  return {
    scale,
    offsetX,
    offsetY,
    logicalWidth,
    logicalHeight,
  };
}

export function worldToCanvas(point: PolygonEditorPoint, metrics: CanvasMetrics, bounds: LogicalBounds) {
  const transform = getViewTransform(metrics, bounds);
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY - point.y * transform.scale,
  };
}

export function roundCoordinate(value: number) {
  return Math.round(value * SNAP_PRECISION) / SNAP_PRECISION;
}

export function snapPointWithGrid(point: PolygonEditorPoint, grid: PolygonEditorGrid, bounds: LogicalBounds) {
  if (!grid.enabled) {
    return clampToLogicalBounds({
      x: roundCoordinate(point.x),
      y: roundCoordinate(point.y),
    }, bounds);
  }

  const step = 1 / Math.max(1, grid.minorDivisions);
  return clampToLogicalBounds({
    x: roundCoordinate(Math.round(point.x / step) * step),
    y: roundCoordinate(Math.round(point.y / step) * step),
  }, bounds);
}

export function createRectangleVertices(start: PolygonEditorPoint, end: PolygonEditorPoint, bounds: LogicalBounds) {
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
  ] satisfies PolygonEditorPoint[];
}

export function distanceToSegment(point: PolygonEditorPoint, start: PolygonEditorPoint, end: PolygonEditorPoint) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return {
      distance: Math.hypot(dx, dy),
      point: clonePoint(start),
    };
  }

  const rawT = ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projected = {
    x: start.x + t * deltaX,
    y: start.y + t * deltaY,
  };
  return {
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
    point: projected,
  };
}

export function pointInPolygon(point: PolygonEditorPoint, vertices: readonly ReadonlyVertex[]) {
  if (vertices.length < 3) return false;

  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const current = vertices[index];
    const previousVertex = vertices[previous];
    if (!current || !previousVertex) continue;
    const intersects = ((current.y > point.y) !== (previousVertex.y > point.y))
      && (point.x < ((previousVertex.x - current.x) * (point.y - current.y)) / ((previousVertex.y - current.y) || 1e-12) + current.x);
    if (intersects) inside = !inside;
  }

  return inside;
}

export function findHitVertex(point: PolygonEditorPoint, polygons: readonly ReadonlyPolygon[], threshold: number) {
  for (let polygonIndex = polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = polygons[polygonIndex];
    if (!polygon) continue;
    for (let vertexIndex = 0; vertexIndex < polygon.vertices.length; vertexIndex += 1) {
      const vertex = polygon.vertices[vertexIndex];
      if (!vertex) continue;
      const distance = Math.hypot(point.x - vertex.x, point.y - vertex.y);
      if (distance <= threshold) {
        return {
          polygonId: polygon.id,
          vertexIndex,
          distance,
        } satisfies HitVertex;
      }
    }
  }

  return null;
}

export function findHitEdge(
  point: PolygonEditorPoint,
  polygons: readonly ReadonlyPolygon[],
  threshold: number,
  snapper: (point: PolygonEditorPoint) => PolygonEditorPoint,
) {
  for (let polygonIndex = polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = polygons[polygonIndex];
    if (!polygon) continue;
    if (polygon.vertices.length < 2) continue;

    for (let edgeIndex = 0; edgeIndex < polygon.vertices.length; edgeIndex += 1) {
      const start = polygon.vertices[edgeIndex];
      const end = polygon.vertices[(edgeIndex + 1) % polygon.vertices.length];
      if (!start || !end) continue;
      const result = distanceToSegment(point, start, end);
      if (result.distance <= threshold) {
        return {
          polygonId: polygon.id,
          edgeIndex,
          point: snapper(result.point),
          distance: result.distance,
        } satisfies HitEdge;
      }
    }
  }

  return null;
}

export function findHitPolygon(point: PolygonEditorPoint, polygons: readonly ReadonlyPolygon[]) {
  for (let polygonIndex = polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = polygons[polygonIndex];
    if (!polygon) continue;
    if (pointInPolygon(point, polygon.vertices)) {
      return polygon;
    }
  }

  return null;
}
