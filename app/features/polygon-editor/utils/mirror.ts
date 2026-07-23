import type { InternalPolygonEditorPolygon, LogicalBounds, PolygonEditorValue } from '../types';

export function getMirrorCenter(axis: 'x' | 'y', offset: number, bounds: Readonly<LogicalBounds>) {
  if (axis === 'x') {
    return (bounds.minX + bounds.maxX) / 2 + offset;
  } else {
    return (bounds.minY + bounds.maxY) / 2 + offset;
  }
}

function mirrorVertex(vertex: Readonly<Vec2>, axis: 'x' | 'y', center: number) {
  if (axis === 'x') {
    return {
      x: 2 * center - vertex.x,
      y: vertex.y,
    };
  } else {
    return {
      x: vertex.x,
      y: 2 * center - vertex.y,
    };
  }
}

export function withMirroredPolygons(
  value: DeepReadonly<PolygonEditorValue>,
  bounds: Readonly<LogicalBounds>,
): DeepReadonly<InternalPolygonEditorPolygon[]> {
  if (value.mirror.enabled) {
    const { axis } = value.mirror;
    const center = getMirrorCenter(axis, value.mirror.centerOffset, bounds);
    const result = [];
    for (const polygon of value.polygons) {
      const mirrored = {
        isMirrorGhost: true,
        data: {
          id: polygon.id,
          color: polygon.color,
          vertices: polygon.vertices.map((v) => mirrorVertex(v, axis, center)),
        },
      };

      result.push({ isMirrorGhost: false, data: polygon });
      result.push(mirrored);
    }
    return result;
  } else {
    return value.polygons.map((data) => ({
      isMirrorGhost: false,
      data,
    }));
  }
}

export function getMirrorMergedPolygons(
  value: DeepReadonly<PolygonEditorValue>,
  bounds: Readonly<LogicalBounds>,
) {
  if (value.mirror.enabled) {
    const { axis } = value.mirror;
    const center = getMirrorCenter(axis, value.mirror.centerOffset, bounds);

    let idCounter = 1;
    const result = [];
    for (const polygon of value.polygons) {
      const mp = mergePolygons(
        [polygon.vertices],
        [polygon.vertices.map((v) => mirrorVertex(v, axis, center))],
      );
      for (const p of mp) {
        for (const ring of p) {
          result.push({
            id: idCounter++,
            color: polygon.color,
            vertices: ring,
          });
        }
      }
    }
    return result;
  } else {
    return value.polygons;
  }
}
