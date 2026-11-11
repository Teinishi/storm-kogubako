import * as THREE from 'three';
import type { SurfaceEntry } from '~/shared/basicBlocks';
import type { SurfaceRef } from './types';
import { getSurfaceData } from './uv';

export function createRaycasterMesh(surfaces: readonly Readonly<SurfaceEntry & SurfaceRef>[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const triangleToSurfaceRef: SurfaceRef[] = [];

  for (const surface of surfaces) {
    const matrix = swToThreeMat3(surface.matrix);
    const position = swToThreeVec3(scaleSwPosition(surface.position));

    const surfaceData = getSurfaceData(surface.shape);

    const baseIndex = positions.length / 3;

    for (const vertex of surfaceData.threeVertices) {
      const transformedVertex = vertex.clone().applyMatrix3(matrix).add(position);
      positions.push(transformedVertex.x, transformedVertex.y, transformedVertex.z);
    }

    for (const uv of surfaceData.uvs) {
      uvs.push(uv.x, uv.y);
    }

    for (let i = 0; i < surfaceData.threeVertices.length - 2; i++) {
      indices.push(baseIndex, baseIndex + i + 1, baseIndex + i + 2);
      triangleToSurfaceRef.push({
        componentIndex: surface.componentIndex,
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
