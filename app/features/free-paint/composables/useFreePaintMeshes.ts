import { cullSurfaces } from '@sw-file-lib/geometry';
import {
  bufferGeometryFromBuilder,
  createOpaqueMaterial,
  createOpaqueUniforms,
} from '@sw-file-lib/three';
import * as THREE from 'three';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { getSurfacesFromComponents } from '~/shared/basicBlocks';
import {
  buildFreePaintGeometry,
  createRaycasterMesh,
  freePaintToBasicComponent,
  updateRaycaster,
  type FreePaintComponent,
  type SurfaceRef,
} from '../surfacePaint';

export interface TestRaycastResult {
  surfaceRef: SurfaceRef;
  uv: THREE.Vector2;
}

export function useFreePaintMeshes(
  getViewComponents: () => FreePaintComponent[],
  getHitComponents: () => FreePaintComponent[],
) {
  // 表示用の Mesh
  const mainObject = shallowRef(
    new THREE.Mesh(
      new THREE.BufferGeometry(),
      createOpaqueMaterial(
        createOpaqueUniforms({
          overrideColorEnabled: false,
        }),
      ),
    ),
  );
  const triangleToSurfaceRef = shallowRef<SurfaceRef[]>([]);

  watchEffect((onCleanup) => {
    const components = getViewComponents();
    const surfaces = getSurfacesFromComponents(components.map((c) => freePaintToBasicComponent(c)));

    const cullingStartTime = performance.now();

    const culledSurfaceIndices = cullSurfaces(surfaces);

    const cullingTime = performance.now() - cullingStartTime;
    if (cullingTime > 10) {
      console.warn(
        'FreePaint culling took',
        cullingTime.toFixed(2),
        'ms for',
        surfaces.length,
        'surfaces.',
      );
    }

    const visibleSurfaces = surfaces.filter((_, index) => !culledSurfaceIndices.has(index));

    const buildStartTime = performance.now();

    const builder = buildFreePaintGeometry(visibleSurfaces, components, {
      cull: false,
      edge: true,
    });

    const buildTime = performance.now() - buildStartTime;
    if (buildTime > 10) {
      console.warn(
        'FreePaint geometry build took',
        buildTime.toFixed(2),
        'ms for',
        visibleSurfaces.length,
        'surfaces.',
      );
    }
    const geometry = bufferGeometryFromBuilder(builder);
    mainObject.value.geometry = geometry;

    onCleanup(() => {
      geometry.dispose();
    });
  });

  // raycaster 用の Mesh
  const raycasterMesh = shallowRef(
    new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
      }),
    ),
  );

  watchEffect(() => {
    const components = getHitComponents();
    const surfaces = getSurfacesFromComponents(components.map((c) => freePaintToBasicComponent(c)));
    const culledSurfaceIndices = cullSurfaces(surfaces);
    const visibleSurfaces = surfaces.filter((_, index) => !culledSurfaceIndices.has(index));
    const raycasterMeshData = createRaycasterMesh(visibleSurfaces);
    raycasterMesh.value.geometry = raycasterMeshData.geometry;
    triangleToSurfaceRef.value = raycasterMeshData.triangleToSurfaceRef;
  });

  onBeforeUnmount(() => {
    raycasterMesh.value.geometry.dispose();
    raycasterMesh.value.material.dispose();
  });

  // raycaster 判定
  const raycaster = new THREE.Raycaster();

  function testRaycast(context: ThreeCanvasContext, event: MouseEvent): TestRaycastResult | null {
    updateRaycaster(event, raycaster, context.renderer.domElement, context.camera);
    const intersections = raycaster.intersectObject(raycasterMesh.value);

    if (!intersections || intersections.length === 0) return null;
    const intersection = intersections[0]!;

    const faceIndex = intersection.faceIndex;
    if (faceIndex == null) return null;

    const surfaceRef = triangleToSurfaceRef.value[faceIndex];
    if (surfaceRef === undefined) return null;

    const uv = intersection.uv;
    if (!uv) return null;

    return {
      surfaceRef,
      uv,
    };
  }

  return { mainObject, raycasterMesh, triangleToSurfaceRef, testRaycast };
}
