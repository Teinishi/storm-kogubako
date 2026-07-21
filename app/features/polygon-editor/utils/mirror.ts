import type { LogicalBounds, PolygonEditorPolygon, PolygonEditorValue } from '../types';

export function getMirrorCenter(
  axis: 'x' | 'y',
  offset: number,
  bounds: Readonly<LogicalBounds>,
) {
  if (axis === 'x') {
    return (bounds.minX + bounds.maxX) / 2 + offset;
  }
  else {
    return (bounds.minY + bounds.maxY) / 2 + offset;
  }
}

function mirrorVertex(
  vertex: Readonly<Vec2>,
  axis: 'x' | 'y',
  center: number,
) {
  if (axis === 'x') {
    return {
      x: 2 * center - vertex.x,
      y: vertex.y,
    };
  }
  else {
    return {
      x: vertex.x,
      y: 2 * center - vertex.y,
    };
  }
}

function mirrorPolygon(
  polygon: DeepReadonly<PolygonEditorPolygon>,
  axis: 'x' | 'y',
  center: number,
): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(v => mirrorVertex(v, axis, center)),
  };
}

export function getFinalPolygons(
  value: DeepReadonly<PolygonEditorValue>,
  bounds: Readonly<LogicalBounds>,
): DeepReadonly<PolygonEditorPolygon[]> {
  if (value.mirror.enabled) {
    const { axis } = value.mirror;
    const center = getMirrorCenter(axis, value.mirror.centerOffset, bounds);
    const result = [];
    for (const polygon of value.polygons) {
      result.push(polygon);
      result.push(mirrorPolygon(polygon, axis, center));
    }
    return result;
  }
  else {
    return value.polygons;
  }
}
