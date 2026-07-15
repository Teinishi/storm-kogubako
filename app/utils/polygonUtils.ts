import polygonClipping from 'polygon-clipping';
import * as earcut from 'earcut';
import type { Vec2, Rect } from '~/utils/utils';

export function polygonToGeom(points: Vec2[]): polygonClipping.Polygon {
  return [points.map(v => [v.x, v.y])];
}

export function rectToGeom(rect: Rect): polygonClipping.Polygon {
  return [[
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
  ]];
}

// 向きを判定
export function polygonWindingDirection(polygon: readonly Vec2[]) {
  const n = polygon.length;
  if (n < 3) {
    throw new Error('Polygon must have at least 3 vertices.');
  }

  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % n]!;
    area += a.x * b.y - b.x * a.y;
  }

  return area > 0 ? 'CCW' : 'CW';
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
  const normalSign = polygonWindingDirection(polygon) === 'CCW' ? -1 : 1;
  const n = polygon.length;

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

// 重なったポリゴンの重なりを排除
export function eliminatePolygonOverlap<T>(
  polygons: readonly { id: T; vertices: Vec2[] }[],
  base?: { geom: polygonClipping.Geom; id: T },
) {
  const disjointPolygons: { id: T; multiPolygon: polygonClipping.MultiPolygon }[] = [];
  let mask: polygonClipping.MultiPolygon = [];

  for (let i = polygons.length - 1; 0 <= i; i--) {
    const { id, vertices } = polygons[i]!;

    const polygon = polygonToGeom(vertices);
    let multiPolygon = polygonClipping.difference(polygon, mask);
    if (base) {
      multiPolygon = polygonClipping.intersection(multiPolygon, base.geom);
    }

    disjointPolygons.push({ id, multiPolygon });
    mask = polygonClipping.union(mask, polygon);
  }

  if (base) {
    disjointPolygons.push({
      id: base.id,
      multiPolygon: polygonClipping.difference(base.geom, mask),
    });
  }

  return disjointPolygons;
}

// ポリゴンを三角化
export function triangulate(multiPolygon: polygonClipping.MultiPolygon) {
  let vertices: Vec2[] = [];
  let indices: number[] = [];

  for (const polygon of multiPolygon) {
    const offset = vertices.length;

    const localData = earcut.flatten(polygon);

    const localVertices: Vec2[] = [];
    for (let i = 1; i < localData.vertices.length; i += 2) {
      localVertices.push({ x: localData.vertices[i - 1]!, y: localData.vertices[i]! });
    }
    vertices = vertices.concat(localVertices);

    const localIndices = earcut.default(localData.vertices, localData.holes, localData.dimensions);
    indices = indices.concat(localIndices.map(i => i + offset));
  }

  return { vertices, indices };
}

export function polygonsToDisjointTriangles<T>(
  polygons: readonly { id: T; vertices: Vec2[] }[],
  base?: { geom: polygonClipping.Geom; id: T },
) {
  const geometries = eliminatePolygonOverlap(polygons, base);
  const triangulated = geometries.map(({ id, multiPolygon: geom }) => ({ id, ...triangulate(geom) }));
  return triangulated;
}
