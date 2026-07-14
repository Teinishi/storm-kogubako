import { BufferAttribute, type BufferGeometry } from 'three';
import type polygonClipping from 'polygon-clipping';
import type { Vec2, Vec3, Color } from '~/utils/utils';

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

export interface TriangulatedItem {
  vertices: Vec2[];
  indices: number[];
  color: Color;
}

// 三角化したポリゴンで Three.js の BufferGeometry を更新
export function updateGeometry(
  geometry: BufferGeometry,
  triangulated: readonly TriangulatedItem[],
  options?: {
    coordinateConversion?: (point: Vec2) => Vec3;
    flip?: boolean;
    materialIndex?: number;
  },
) {
  const flip = options?.flip ?? false;
  const totalVertexCount = triangulated.reduce((acc, item) => acc + item.vertices.length, 0);

  const positions = new Float32Array(3 * totalVertexCount);
  const colors = new Float32Array(3 * totalVertexCount);
  const indices: number[] = [];

  let offset = 0;
  for (const item of triangulated) {
    const { r, g, b } = item.color;

    for (let i = 0; i < item.indices.length; i++) {
      if (flip && i % 3 === 1) {
        indices.push(offset + item.indices[i + 1]!);
      }
      else if (flip && i % 3 === 2) {
        indices.push(offset + item.indices[i - 1]!);
      }
      else {
        indices.push(offset + item.indices[i]!);
      }
    }

    for (const vertex of item.vertices) {
      let { x, y } = vertex;
      let z = 0;
      if (options?.coordinateConversion) {
        const converted = options.coordinateConversion(vertex);
        x = converted.x;
        y = converted.y;
        z = converted.z;
      }
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

  geometry.addGroup(0, indices.length, options?.materialIndex ?? 0);
}

// ポリゴンをZ軸方向に押し出した側面を BufferGeometry に
export function updateExtrudedSideGeometry(
  geometry: BufferGeometry,
  geom: polygonClipping.MultiPolygon,
  options?: {
    noClose?: boolean;
    z: [number, number];
    color?: Color;
    inside?: boolean;
    coordinateConversion?: (point: Vec2) => Vec2;
  },
) {
  const [z1, z2] = options?.z ?? [0, 1];
  const color = options?.color;
  const inside = options?.inside ?? false;

  let totalVertexCount = geom.flat().reduce((acc, ring) => acc + ring.length, 0);
  if (options?.noClose) {
    totalVertexCount--;
  }

  const positions = new Float32Array({ length: 12 * totalVertexCount });
  const normals = new Float32Array({ length: 12 * totalVertexCount });
  const colors = new Float32Array({ length: 12 * totalVertexCount });

  const indices: number[] = [];

  let indexOffset = 0;
  for (const ring of geom.flat()) {
    const n = ring.length;
    const red = (color?.r ?? 255) / 255;
    const green = (color?.g ?? 255) / 255;
    const blue = (color?.b ?? 255) / 255;

    for (let i = 0; i < (options?.noClose ? n - 1 : n); i++) {
      const bufStart = 3 * indexOffset + 12 * i;
      let [ax, ay] = ring[i]!;
      let [bx, by] = ring[(i + 1) % n]!;
      if (options?.coordinateConversion) {
        const aConverted = options.coordinateConversion({ x: ax, y: ay });
        const bConverted = options.coordinateConversion({ x: bx, y: by });
        ax = aConverted.x;
        ay = aConverted.y;
        bx = bConverted.x;
        by = bConverted.y;
      }
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);

      // CCWの外向き法線
      let nx = dy / len;
      let ny = -dx / len;

      if (inside) {
        nx = -nx;
        ny = -ny;
      }

      positions[bufStart] = ax;
      positions[bufStart + 1] = ay;
      positions[bufStart + 2] = z1;
      positions[bufStart + 3] = bx;
      positions[bufStart + 4] = by;
      positions[bufStart + 5] = z1;
      positions[bufStart + 6] = ax;
      positions[bufStart + 7] = ay;
      positions[bufStart + 8] = z2;
      positions[bufStart + 9] = bx;
      positions[bufStart + 10] = by;
      positions[bufStart + 11] = z2;

      for (let j = 0; j < 4; j++) {
        normals[bufStart + 3 * j] = nx;
        normals[bufStart + 3 * j + 1] = ny;
        normals[bufStart + 3 * j + 2] = 0;
        colors[bufStart + 3 * j] = red;
        colors[bufStart + 3 * j + 1] = green;
        colors[bufStart + 3 * j + 2] = blue;
      }

      const indexBase = indexOffset + 4 * i;
      if (!inside) {
        indices.push(
          indexBase + 0, indexBase + 2, indexBase + 1,
          indexBase + 1, indexBase + 2, indexBase + 3,
        );
      }
      else {
        indices.push(
          indexBase + 0, indexBase + 1, indexBase + 2,
          indexBase + 1, indexBase + 3, indexBase + 2,
        );
      }
    }

    indexOffset += 4 * n;
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(indices);

  geometry.addGroup(0, indices.length, 0);
}
