import polygonClipping from 'polygon-clipping';
import * as earcut from 'earcut';
import { BufferAttribute, type BufferGeometry } from 'three';
import type { PolygonEditorPoint, PolygonEditorPolygon } from './polygonEditorCore';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface TriangulatedItem {
  id: number;
  vertices: Point2D[];
  indices: number[];
}

// 自前の PolygonEditor 用形式から polygon-clipping の形式へ変換
function editorToClipping(vertices: PolygonEditorPoint[]): polygonClipping.Polygon {
  return [vertices.map(v => [v.x, v.y])];
}

export function polygonsToDisjointTriangles(polygons: PolygonEditorPolygon[], rect?: Rect) {
  const rectGeom: polygonClipping.Polygon | undefined = rect
    ? [[
        [rect.x, rect.y],
        [rect.x + rect.width, rect.y],
        [rect.x + rect.width, rect.y + rect.height],
        [rect.x, rect.y + rect.height],
      ]]
    : undefined;

  const disjointPolygons: { id: number; geom: polygonClipping.MultiPolygon }[] = [];
  let mask: polygonClipping.Geom = [];

  for (let i = polygons.length - 1; 0 <= i; i--) {
    const { id, vertices } = polygons[i]!;

    const polygon = editorToClipping(vertices);
    let geom = polygonClipping.difference(polygon, mask);
    if (rectGeom) {
      geom = polygonClipping.intersection(geom, rectGeom);
    }

    disjointPolygons.push({ id, geom });
    mask = polygonClipping.union(mask, polygon);
  }

  if (rect && rectGeom) {
    disjointPolygons.push({
      id: -1,
      geom: polygonClipping.difference(rectGeom, mask),
    });
  }

  const triangulated = disjointPolygons.map(({ id, geom }) => {
    let vertices: Point2D[] = [];
    let indices: number[] = [];

    for (const polygon of geom) {
      const offset = vertices.length;

      const localData = earcut.flatten(polygon);

      const localVertices: Point2D[] = [];
      for (let i = 1; i < localData.vertices.length; i += 2) {
        localVertices.push({ x: localData.vertices[i - 1]!, y: localData.vertices[i]! });
      }
      vertices = vertices.concat(localVertices);

      const localIndices = earcut.default(localData.vertices, localData.holes, localData.dimensions);
      indices = indices.concat(localIndices.map(i => i + offset));
    }

    return { id, vertices, indices };
  });

  return triangulated;
}

export function updateGeometry(
  geometry: BufferGeometry,
  triangulated: TriangulatedItem[],
  getColor: (item: TriangulatedItem) => { r: number; g: number; b: number },
  coordinateConversion: (point: Point2D) => { x: number; y: number; z: number },
) {
  const totalVertexCount = triangulated.reduce((acc, item) => acc + item.vertices.length, 0);

  const positions = new Float32Array(3 * totalVertexCount);
  const colors = new Float32Array(3 * totalVertexCount);
  let indices: number[] = [];

  let offset = 0;
  for (const item of triangulated) {
    const { r, g, b } = getColor(item);

    indices = indices.concat(item.indices.map(i => i + offset));

    for (const vertex of item.vertices) {
      const { x, y, z } = coordinateConversion(vertex);
      positions[3 * offset] = x;
      positions[3 * offset + 1] = y;
      positions[3 * offset + 2] = z;
      colors[3 * offset] = r / 255;
      colors[3 * offset + 1] = g / 255;
      colors[3 * offset + 2] = b / 255;
      offset++;
    }
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  geometry.addGroup(0, indices.length, 0);
}
