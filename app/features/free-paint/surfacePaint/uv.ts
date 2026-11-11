import type * as THREE from 'three';
import { getSurfaceShape, type SurfaceShape } from '~/shared/surfaces';

export interface SurfaceUVMapping {
  uvOrigin: Vec3;
  uVector: Vec3;
  vVector: Vec3;
}

export function uvToPosition(u: number, v: number, uvMapping: SurfaceUVMapping): Vec3 {
  const { uvOrigin, uVector, vVector } = uvMapping;
  return addVec3(uvOrigin, addVec3(mulVec3(uVector, u), mulVec3(vVector, v)));
}

function createFaceUVs(vertices: readonly Readonly<Vec3>[]): {
  uvs: Vec2[];
  uvMapping: SurfaceUVMapping;
} {
  if (vertices.length < 3) {
    throw new Error('At least 3 vertices are required to create UVs.');
  }

  const v0 = vertices[0]!;
  const v1 = vertices[1]!;
  const v2 = vertices[2]!;

  const e1 = subVec3(v1, v0);
  const e2 = subVec3(v2, v0);

  const uAxis = normalizeVec3(e1);
  const normal = normalizeVec3(crossVec3(e1, e2));
  const vAxis = normalizeVec3(crossVec3(normal, uAxis));

  const points = vertices.map((vertex) => {
    const relative = subVec3(vertex, v0);
    return { x: dotVec3(relative, uAxis), y: dotVec3(relative, vAxis) };
  });

  const minU = Math.min(...points.map((p) => p.x));
  const maxU = Math.max(...points.map((p) => p.x));
  const minV = Math.min(...points.map((p) => p.y));
  const maxV = Math.max(...points.map((p) => p.y));
  const sizeU = maxU - minU;
  const sizeV = maxV - minV;

  const uvs = points.map((p) => ({ x: (p.x - minU) / sizeU, y: (p.y - minV) / sizeV }));

  const uvOrigin = addVec3(v0, addVec3(mulVec3(uAxis, minU), mulVec3(vAxis, minV)));
  const uVector = mulVec3(uAxis, sizeU);
  const vVector = mulVec3(vAxis, sizeV);

  return { uvs, uvMapping: { uvOrigin, uVector, vVector } };
}

interface SurfaceData {
  swVertices: readonly Readonly<Vec3>[];
  threeVertices: THREE.Vector3[];
  uvs: Vec2[];
  uvMapping: SurfaceUVMapping;
}

const surfaceDatasCache = new Map<SurfaceShape, SurfaceData>();

export function getSurfaceData(shape: SurfaceShape): SurfaceData {
  if (surfaceDatasCache.has(shape)) {
    return surfaceDatasCache.get(shape)!;
  }

  const swVertices = getSurfaceShape(shape);
  const threeVertices = swVertices.map(swToThreeVec3);

  const uvMapping = createFaceUVs(swVertices);
  const surfaceData: SurfaceData = { swVertices, threeVertices, ...uvMapping };
  surfaceDatasCache.set(shape, surfaceData);
  return surfaceData;
}
