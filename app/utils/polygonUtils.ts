import polygonClipping from 'polygon-clipping';

function forPolygonClipping(polygon: DeepReadonly<Vec2[][]>): polygonClipping.Polygon {
  return polygon.map((ring) => ring.map((v) => [v.x, v.y]));
}

function toVec2Polygon(polygon: DeepReadonly<polygonClipping.Polygon>): Vec2[][] {
  return polygon.map((ring) => ring.map((v) => ({ x: v[0], y: v[1] })));
}

export function rectToRing(rect: Readonly<Rect>): Vec2[] {
  const { x, y, width, height } = normalizeRect(rect);
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

// 向きを判定
function ringWindingDirection(ring: DeepReadonly<Vec2[]>) {
  const n = ring.length;
  if (n < 3) {
    throw new Error('Polygon must have at least 3 vertices.');
  }

  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    area += a.x * b.y - b.x * a.y;
  }

  return area > 0 ? 'CCW' : 'CW';
}

// 角丸矩形のポリゴンを生成
export function createRoundedRectPolygon(
  rect: Readonly<Rect>,
  radius: number | Readonly<Vec2>,
  segments: number,
): Vec2[] {
  const { x, y, width, height } = normalizeRect(rect);

  let rx: number, ry: number;
  if (typeof radius === 'number') {
    rx = radius;
    ry = radius;
  } else {
    rx = radius.x;
    ry = radius.y;
  }

  const rxCapped = rx >= width / 2;
  const ryCapped = ry >= height / 2;
  if (rxCapped) {
    rx = width / 2;
  }
  if (ryCapped) {
    ry = height / 2;
  }

  const s = Math.max(1, Math.floor(segments));

  if (rx === 0 || ry === 0) {
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
        x: cx + Math.cos(a) * rx,
        y: cy + Math.sin(a) * ry,
      });
    }
  }

  addArc(x + width - rx, y + ry, -Math.PI / 2, 0, !rxCapped);
  addArc(x + width - rx, y + height - ry, 0, Math.PI / 2, !ryCapped);
  addArc(x + rx, y + height - ry, Math.PI / 2, Math.PI, !rxCapped);
  addArc(x + rx, y + ry, Math.PI, Math.PI * 1.5, !ryCapped);

  return points;
}

// ポリゴンを太らせる
export function offsetRing(ring: DeepReadonly<Vec2[]>, distance: number): Vec2[] {
  const normalSign = ringWindingDirection(ring) === 'CCW' ? -1 : 1;
  const n = ring.length;

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

  let n1 = normal(ring.at(-1)!, ring.at(0)!);
  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n]!;
    const curr = ring[i]!;
    const next = ring[(i + 1) % n]!;

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
    } else {
      // 平行なら法線の平均方向へ移動
      const nx = n1.x + n2.x;
      const ny = n1.y + n2.y;
      const len = Math.hypot(nx, ny);

      if (len < 1e-8) {
        result.push({
          x: curr.x + n1.x * distance,
          y: curr.y + n1.y * distance,
        });
      } else {
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

export function mergePolygons(a: DeepReadonly<Vec2[][]>, b: DeepReadonly<Vec2[][]>) {
  const mp = polygonClipping.union(forPolygonClipping(a), forPolygonClipping(b));
  return mp.map(toVec2Polygon);
}

interface PolygonWithId<T> {
  id: T;
  polygon: Vec2[][];
}

// 重なったポリゴンの重なりを排除
export function eliminatePolygonOverlap<T>(
  polygons: DeepReadonly<PolygonWithId<T>[]>,
  options?: {
    base?: DeepReadonly<PolygonWithId<T>>;
    holes?: DeepReadonly<Vec2[][]>;
  },
) {
  const base = options?.base;
  const holes = options?.holes ?? [];

  const basePolygon = base ? forPolygonClipping(base?.polygon) : undefined;
  const masks: polygonClipping.Polygon[] = holes.map((ring) => forPolygonClipping([ring]));
  const disjointPolygons: {
    id: DeepReadonly<T>;
    multiPolygon: polygonClipping.MultiPolygon;
  }[] = [];

  for (const item of polygons.toReversed()) {
    const polygon = forPolygonClipping(item.polygon);

    let p = [polygon];
    for (const mask of masks) {
      p = polygonClipping.difference(p, mask);
    }
    if (basePolygon) {
      p = polygonClipping.intersection(p, basePolygon);
    }

    disjointPolygons.push({ id: item.id, multiPolygon: p });

    masks.push(polygon);
  }

  if (base && basePolygon) {
    let p = [basePolygon];
    for (const mask of masks) {
      p = polygonClipping.difference(p, mask);
    }

    disjointPolygons.push({
      id: base.id,
      multiPolygon: p,
    });
  }

  return disjointPolygons.flatMap(({ id, multiPolygon }) => {
    return multiPolygon.map((polygon) => ({
      id,
      polygon: toVec2Polygon(polygon),
    }));
  });
}
