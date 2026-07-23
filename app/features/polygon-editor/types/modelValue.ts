import type { z } from 'zod';
import type {
  PolygonEditorMirrorSchema,
  PolygonEditorPolygonSchema,
  PolygonEditorValueSchema,
} from '../schemas';

export type PolygonEditorMirror = z.infer<typeof PolygonEditorMirrorSchema>;
export type PolygonEditorPolygon = z.infer<typeof PolygonEditorPolygonSchema>;
export type PolygonEditorValue = z.infer<typeof PolygonEditorValueSchema>;

export interface InternalPolygonEditorPolygon {
  isMirrorGhost?: boolean;
  data: PolygonEditorPolygon;
}

export interface InternalPolygonEditorValue {
  mirror: PolygonEditorMirror;
  polygons: InternalPolygonEditorPolygon[];
}

export function clonePolygon(polygon: DeepReadonly<PolygonEditorPolygon>): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(cloneVec2),
  };
}

export function clonePolygonEditorValue(
  value: DeepReadonly<PolygonEditorValue>,
): PolygonEditorValue {
  return {
    mirror: { ...value.mirror },
    polygons: value.polygons.map(clonePolygon),
  };
}

export function transformPolygons(
  polygons: DeepReadonly<PolygonEditorPolygon[]>,
  coordinateConversion: (p: Readonly<Vec2>) => Vec2,
): PolygonEditorPolygon[] {
  return polygons.map(({ id, color, vertices }) => ({
    id,
    color,
    vertices: vertices.map(coordinateConversion),
  }));
}
