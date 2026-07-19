import type { ReadonlyPolygon } from '../types';

export const GRID_SCALE = 56;
export const HANDLE_HIT_THRESHOLD_PX = 8;

export interface HitVertex {
  polygonId: number;
  vertexIndex: number;
  distance: number;
}

export interface HitEdge {
  polygonId: number;
  edgeIndex: number;
  point: Vec2;
  distance: number;
}

export function findHitVertex(
  point: Readonly<Vec2>,
  polygons: readonly ReadonlyPolygon[],
  threshold: number,
) {
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
  point: Readonly<Vec2>,
  polygons: readonly ReadonlyPolygon[],
  threshold: number,
  snapper: (point: Vec2) => Vec2,
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

export function findHitPolygon(point: Vec2, polygons: readonly ReadonlyPolygon[]) {
  for (let polygonIndex = polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = polygons[polygonIndex];
    if (!polygon) continue;
    if (pointInPolygon(point, polygon.vertices)) {
      return polygon;
    }
  }

  return null;
}
