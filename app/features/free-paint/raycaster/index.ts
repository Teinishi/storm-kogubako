import * as THREE from 'three';
import type { SurfaceEntry, SurfaceRef } from '~/shared/basicBlocks';
import { getSurfaceShape, type SurfaceShape } from '~/shared/surfaces';

function createFaceUVs(vertices: THREE.Vector3[]): THREE.Vector2[] {
  if (vertices.length < 3) {
    throw new Error('At least 3 vertices are required to create UVs.');
  }

  const v0 = vertices[0]!;
  const v1 = vertices[1]!;
  const v2 = vertices[2]!;

  const e1 = v1.clone().sub(v0);
  const e2 = v2.clone().sub(v0);

  const uAxis = e1.clone().normalize();
  const normal = e1.clone().cross(e2).normalize();
  const vAxis = normal.clone().cross(uAxis).normalize();

  const points = vertices.map((vertex) => {
    const relative = vertex.clone().sub(v0);
    return new THREE.Vector2(relative.dot(uAxis), relative.dot(vAxis));
  });

  const minU = Math.min(...points.map((p) => p.x));
  const maxU = Math.max(...points.map((p) => p.x));
  const minV = Math.min(...points.map((p) => p.y));
  const maxV = Math.max(...points.map((p) => p.y));

  return points.map(
    (p) => new THREE.Vector2((p.x - minU) / (maxU - minU), (p.y - minV) / (maxV - minV)),
  );
}

interface SurfaceData {
  vertices: THREE.Vector3[];
  uvs: THREE.Vector2[];
}

const surfaceDatasCache = new Map<SurfaceShape, SurfaceData>();

function getSurfaceData(shape: SurfaceShape): SurfaceData {
  if (surfaceDatasCache.has(shape)) {
    return surfaceDatasCache.get(shape)!;
  }

  const vertices = getSurfaceShape(shape);
  const threeVertices = vertices.map(swToThreeVec3);
  const uvs = createFaceUVs(threeVertices);
  const surfaceData: SurfaceData = { vertices: threeVertices, uvs };
  surfaceDatasCache.set(shape, surfaceData);
  return surfaceData;
}

export function createRaycasterMesh(surfaces: readonly Readonly<SurfaceEntry>[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const triangleToSurfaceRef: SurfaceRef[] = [];

  for (const surface of surfaces) {
    const matrix = swToThreeMat3(surface.matrix);
    const position = swToThreeVec3(scaleSwPosition(surface.position));

    const surfaceData = getSurfaceData(surface.shape);

    const baseIndex = positions.length / 3;

    for (const vertex of surfaceData.vertices) {
      const transformedVertex = vertex.clone().applyMatrix3(matrix).add(position);
      positions.push(transformedVertex.x, transformedVertex.y, transformedVertex.z);
    }

    for (const uv of surfaceData.uvs) {
      uvs.push(uv.x, uv.y);
    }

    for (let i = 0; i < surfaceData.vertices.length - 2; i++) {
      indices.push(baseIndex, baseIndex + i + 1, baseIndex + i + 2);
      triangleToSurfaceRef.push({
        blockIndex: surface.blockIndex,
        surfaceIndex: surface.surfaceIndex,
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, triangleToSurfaceRef };
}

export function raycasterIntersections(
  event: MouseEvent,
  raycaster: THREE.Raycaster,
  object: THREE.Object3D,
  canvas: HTMLElement,
  camera: THREE.Camera,
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect) return null;
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);

  return raycaster.intersectObject(object);
}
