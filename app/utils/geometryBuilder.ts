import type { BufferGeometry } from 'three';
import { BufferAttribute } from 'three';
import type { Vec3, Color } from './utils';

function computeNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;

  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;

  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;

  const len = Math.hypot(nx, ny, nz);

  if (len === 0) {
    return { x: 0, y: 0, z: 1 };
  }

  return {
    x: nx / len,
    y: ny / len,
    z: nz / len,
  };
}

export class GeometryBuilder {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly colors: number[] = [];
  private readonly indices: number[] = [];

  addFace(vertices: readonly Vec3[], color: Color): void {
    if (vertices.length < 3) {
      return;
    }

    const red = color.r / 255;
    const green = color.g / 255;
    const blue = color.b / 255;

    const normal = computeNormal(vertices[0]!, vertices[1]!, vertices[2]!);
    const base = this.positions.length / 3;

    for (const v of vertices) {
      this.positions.push(v.x, v.y, v.z);
      this.normals.push(normal.x, normal.y, normal.z);
      this.colors.push(red, green, blue);
    }

    for (let i = 1; i < vertices.length - 1; i++) {
      this.indices.push(base, base + i, base + i + 1);
    }
  }

  apply(geometry: BufferGeometry): void {
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.positions), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(this.normals), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.colors), 3));
    geometry.setIndex(this.indices);
    geometry.addGroup(0, this.indices.length, 0);
  }
}
