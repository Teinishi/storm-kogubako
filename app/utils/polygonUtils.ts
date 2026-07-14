import polygonClipping from 'polygon-clipping';
import * as earcut from 'earcut';
import { BufferAttribute, type BufferGeometry } from 'three';
import type { Vec2, Rect } from '~/utils/utils';
import type { PolygonEditorPolygon } from './polygonEditorCore';

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
function editorToClipping(vertices: Vec2[]): polygonClipping.Polygon {
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

// 角丸矩形のポリゴンを生成
export function createRoundedRectPolygon(
  { x, y, width, height }: Rect,
  radius: number,
  segments: number,
): Vec2[] {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const s = Math.max(1, Math.floor(segments));

  if (r === 0) {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }

  const points: Vec2[] = [];

  function addArc(
    cx: number,
    cy: number,
    startAngle: number,
    endAngle: number,
    includeStart: boolean,
  ) {
    const begin = includeStart ? 0 : 1;
    for (let i = begin; i <= s; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / s);
      points.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
      });
    }
  }

  addArc(x + width - r, y + r, -Math.PI / 2, 0, true);
  addArc(x + width - r, y + height - r, 0, Math.PI / 2, true);
  addArc(x + r, y + height - r, Math.PI / 2, Math.PI, true);
  addArc(x + r, y + r, Math.PI, Math.PI * 1.5, true);

  return points;
}

// ポリゴンを太らせる
export function offsetPolygon(
  polygon: readonly Vec2[],
  distance: number,
): Vec2[] {
  const n = polygon.length;
  if (n < 3) {
    throw new Error('Polygon must have at least 3 vertices.');
  }

  // 向きを判定
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % n]!;
    area += a.x * b.y - b.x * a.y;
  }
  const normalSign = area > 0 ? -1 : 1;

  const result: Vec2[] = [];

  function normal(p1: Vec2, p2: Vec2): Vec2 {
    const ex = p2.x - p1.x;
    const ey = p2.y - p1.y;
    const len = Math.hypot(ex, ey);
    return { x: normalSign * (-ey / len), y: normalSign * (ex / len) };
  }

  function intersectLines(
    ax1: number,
    ay1: number,
    ax2: number,
    ay2: number,
    bx1: number,
    by1: number,
    bx2: number,
    by2: number,
  ): Vec2 | null {
    const dax = ax2 - ax1;
    const day = ay2 - ay1;
    const dbx = bx2 - bx1;
    const dby = by2 - by1;

    const det = dax * dby - day * dbx;

    if (Math.abs(det) < 1e-8) {
      return null;
    }

    const t = ((bx1 - ax1) * dby - (by1 - ay1) * dbx) / det;

    return {
      x: ax1 + dax * t,
      y: ay1 + day * t,
    };
  }

  let n1 = normal(polygon.at(-1)!, polygon.at(0)!);
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i - 1 + n) % n]!;
    const curr = polygon[i]!;
    const next = polygon[(i + 1) % n]!;

    const n2 = normal(curr, next);

    // オフセット後の2直線
    const a1x = prev.x + n1.x * distance;
    const a1y = prev.y + n1.y * distance;
    const a2x = curr.x + n1.x * distance;
    const a2y = curr.y + n1.y * distance;

    const b1x = curr.x + n2.x * distance;
    const b1y = curr.y + n2.y * distance;
    const b2x = next.x + n2.x * distance;
    const b2y = next.y + n2.y * distance;

    const p = intersectLines(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y);

    if (p) {
      result.push(p);
    }
    else {
      // 平行なら法線の平均方向へ移動
      const nx = n1.x + n2.x;
      const ny = n1.y + n2.y;
      const len = Math.hypot(nx, ny);

      if (len < 1e-8) {
        result.push({
          x: curr.x + n1.x * distance,
          y: curr.y + n1.y * distance,
        });
      }
      else {
        result.push({
          x: curr.x + (nx / len) * distance,
          y: curr.y + (ny / len) * distance,
        });
      }
    }

    n1 = n2;
  }

  return result;
}

export function polygonOnCanvas(ctx: CanvasRenderingContext2D, polygon: readonly Vec2[], coordinateConversion?: (point: Vec2) => Vec2) {
  polygon.forEach((point, i) => {
    const p = coordinateConversion ? coordinateConversion(point) : point;
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    }
    else {
      ctx.lineTo(p.x, p.y);
    }
  });
}
