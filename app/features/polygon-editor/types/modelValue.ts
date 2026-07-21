export interface PolygonEditorPolygon {
  id: number;
  color: string;
  vertices: Vec2[];
}

export interface PolygonEditorValue {
  polygons: PolygonEditorPolygon[];
}

export function clonePolygon(polygon: DeepReadonly<PolygonEditorPolygon>): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(cloneVec2),
  };
}

export function clonePolygonEditorValue(value: DeepReadonly<PolygonEditorValue>): PolygonEditorValue {
  return { polygons: value.polygons.map(clonePolygon) };
}

export function createDefaultPolygonEditorValue(): PolygonEditorValue {
  return { polygons: [] };
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
