import type { BufferGeometry } from 'three';
import { BufferAttribute } from 'three';
import { type Vec3, type Color, WHITE, type Vec2 } from './utils';
import * as earcut from 'earcut';

const DEFAULT_OPAQUE_COLOR = WHITE;
const DEFAULT_GLASS_COLOR = {
  r: 160,
  g: 160,
  b: 199,
  a: 128,
};
const DEFAULT_ADDITIVE_COLOR = WHITE;

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

function getVertexFromFlat(flatVertices: readonly number[], index: number): Vec3 | null {
  if (index < 0 || flatVertices.length < index * 3 + 3) {
    return null;
  }
  return {
    x: flatVertices[3 * index]!,
    y: flatVertices[3 * index + 1]!,
    z: flatVertices[3 * index + 2]!,
  };
}

function vec2RingToTuple(ring: readonly Vec2[], z?: number) {
  return ring.map(p => z === undefined ? [p.x, p.y] : [p.x, p.y, z]);
}

interface GeometryGroup {
  end: number;
  materialIndex: number;
}

interface AddFaceOptions {
  materialIndex?: number;
  color?: Color;
  flip?: boolean;
}

interface AddPolygonOptions extends AddFaceOptions {
  holes?: Vec2[][];
  z?: number;
}

interface AddExtrudedSideOptions extends AddFaceOptions {
  close?: boolean;
  zRange: [number, number];
}

export class GeometryBuilder {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly colors: number[] = [];
  private readonly indices: number[] = [];
  private readonly groups: GeometryGroup[] = [];

  private addCoplanarTriangles(flatVertices: readonly number[], indices: readonly number[], options?: AddFaceOptions) {
    if (indices.length < 3) {
      throw new Error('Indices must have at least 3 vertices.');
    }
    if (indices.length % 3 !== 0) {
      throw new Error('the length of indices must be multiples of 3.');
    }

    const materialIndex = options?.materialIndex ?? 0;
    let color = DEFAULT_OPAQUE_COLOR;
    if (options?.color) {
      color = options.color;
    }
    else if (materialIndex === 1) {
      color = DEFAULT_GLASS_COLOR;
    }
    else if (materialIndex === 2) {
      color = DEFAULT_ADDITIVE_COLOR;
    }
    const red = color.r / 255;
    const green = color.g / 255;
    const blue = color.b / 255;

    const normal = computeNormal(
      getVertexFromFlat(flatVertices, 0)!,
      getVertexFromFlat(flatVertices, 1)!,
      getVertexFromFlat(flatVertices, 2)!,
    );
    if (options?.flip) {
      normal.x *= -1;
      normal.y *= -1;
      normal.z *= -1;
    }

    const base = this.positions.length / 3;

    this.positions.push(...flatVertices);
    for (let i = 0; i < flatVertices.length / 3; i++) {
      this.normals.push(normal.x, normal.y, normal.z);
      this.colors.push(red, green, blue);
    }

    for (let i = 0; i + 2 < indices.length; i += 3) {
      const tri = indices.slice(i, i + 3);
      if (options?.flip) {
        this.indices.push(base + tri[0]!, base + tri[2]!, base + tri[1]!);
      }
      else {
        this.indices.push(base + tri[0]!, base + tri[1]!, base + tri[2]!);
      }
    }

    const prevGroup = this.groups[this.groups.length - 1];
    if (prevGroup?.materialIndex === materialIndex) {
      prevGroup.end = this.indices.length;
    }
    else {
      this.groups.push({ end: this.indices.length, materialIndex });
    }
  }

  addFace(vertices: readonly Vec3[], options?: number | Color | AddFaceOptions) {
    if (vertices.length < 3) {
      return;
    }

    const normalizedOptions: AddFaceOptions = {};
    if (typeof options === 'number') {
      normalizedOptions.materialIndex = options;
    }
    else if (options !== undefined && 'r' in options) {
      normalizedOptions.color = options;
    }
    else {
      Object.assign(normalizedOptions, options);
    }

    const indices = [];
    for (let i = 0; i < vertices.length - 2; i++) {
      indices.push(0, i + 1, i + 2);
    }

    const flatVertices = vertices.flatMap(v => [v.x, v.y, v.z]);

    this.addCoplanarTriangles(flatVertices, indices, normalizedOptions);
  }

  addPolygon(polygon: readonly Vec2[], options?: AddPolygonOptions) {
    const z = options?.z ?? 0;

    const data = [vec2RingToTuple(polygon, z)];
    if (options?.holes) {
      data.push(...options.holes.map(hole => vec2RingToTuple(hole, z)));
    }
    const earcutData = earcut.flatten(data);
    const indices = earcut.default(earcutData.vertices, earcutData.holes, earcutData.dimensions);

    this.addCoplanarTriangles(earcutData.vertices, indices, options);
  }

  addExtrudedSide(vertices: Vec2[], options?: AddExtrudedSideOptions) {
    const [z1, z2] = options?.zRange ?? [0, 1];

    const quadCount = options?.close ? vertices.length : vertices.length - 1;

    for (let i = 0; i < quadCount; i++) {
      const { x: ax, y: ay } = vertices[i]!;
      const { x: bx, y: by } = vertices[(i + 1) % vertices.length]!;

      if ((bx - ax) ** 2 + (by - ay) ** 2 === 0) {
        continue;
      }

      const quad = [
        { x: ax, y: ay, z: z1 },
        { x: ax, y: ay, z: z2 },
        { x: bx, y: by, z: z2 },
        { x: bx, y: by, z: z1 },
      ];

      this.addFace(quad, options);
    }
  }

  apply(geometry: BufferGeometry) {
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.positions), 3));
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(this.normals), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.colors), 3));
    geometry.setIndex(this.indices);
    let start = 0;
    for (const group of this.groups) {
      geometry.addGroup(start, group.end - start, group.materialIndex);
      start = group.end;
    }
  }
}
