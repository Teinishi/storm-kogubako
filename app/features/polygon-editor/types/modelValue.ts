export interface PolygonEditorPolygon {
  id: number;
  color: string;
  vertices: Vec2[];
}

export interface PolygonEditorValue {
  polygons: PolygonEditorPolygon[];
}

export interface ReadonlyPolygon {
  readonly id: number;
  readonly color: string;
  readonly vertices: readonly Readonly<Vec2>[];
}

export function clonePolygon(polygon: PolygonEditorPolygon): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(cloneVec2),
  };
}

export function clonePolygonEditorValue(value: PolygonEditorValue): PolygonEditorValue {
  return { polygons: value.polygons.map(clonePolygon) };
}

export function createDefaultPolygonEditorValue(): PolygonEditorValue {
  return { polygons: [] };
}
