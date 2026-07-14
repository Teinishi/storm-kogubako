import { BufferAttribute, type BufferGeometry } from 'three';
import type { Vec2, Vec3, Color3 } from '~/utils/utils';
import { type TriangulatedItem, polygonWindingDirection } from './polygonUtils';

// ポリゴンを Canvas に書く
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

// 三角化したポリゴンで Three.js の BufferGeometry を更新
export function updateGeometry(
  geometry: BufferGeometry,
  triangulated: readonly TriangulatedItem[],
  getColor: (item: TriangulatedItem) => Color3,
  coordinateConversion: (point: Vec2) => Vec3,
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

// ポリゴンをZ軸方向に押し出した側面を BufferGeometry に
export function updateExtrudedSideGeometry(
  geometry: BufferGeometry,
  polygon: readonly Vec2[],
  z1: number,
  z2: number,
  color: Color3,
  inside = false,
) {
  if (polygonWindingDirection(polygon) === 'CW') {
    inside = !inside;
  }

  const n = polygon.length;
  const red = color.r / 255;
  const green = color.g / 255;
  const blue = color.b / 255;

  const positions = new Float32Array({ length: 12 * n });
  const normals = new Float32Array({ length: 12 * n });
  const colors = new Float32Array({ length: 12 * n });
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % n]!;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);

    if (len === 0) continue;

    // CCWの外向き法線
    let nx = dy / len;
    let ny = -dx / len;

    if (inside) {
      nx = -nx;
      ny = -ny;
    }

    positions[12 * i] = a.x;
    positions[12 * i + 1] = a.y;
    positions[12 * i + 2] = z1;
    positions[12 * i + 3] = b.x;
    positions[12 * i + 4] = b.y;
    positions[12 * i + 5] = z1;
    positions[12 * i + 6] = a.x;
    positions[12 * i + 7] = a.y;
    positions[12 * i + 8] = z2;
    positions[12 * i + 9] = b.x;
    positions[12 * i + 10] = b.y;
    positions[12 * i + 11] = z2;

    for (let j = 0; j < 4; j++) {
      normals[12 * i + 3 * j] = nx;
      normals[12 * i + 3 * j + 1] = ny;
      normals[12 * i + 3 * j + 2] = 0;
      colors[12 * i + 3 * j] = red;
      colors[12 * i + 3 * j + 1] = green;
      colors[12 * i + 3 * j + 2] = blue;
    }

    const base = 4 * i;
    if (!inside) {
      indices.push(
        base + 0, base + 2, base + 1,
        base + 1, base + 2, base + 3,
      );
    }
    else {
      indices.push(
        base + 0, base + 1, base + 2,
        base + 1, base + 3, base + 2,
      );
    }
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(indices);

  geometry.addGroup(0, indices.length, 0);
}
