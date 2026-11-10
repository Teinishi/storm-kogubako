<script setup lang="ts">
import { buildSurfacesGeometry, cullSurfaces } from '@sw-file-lib/geometry';
import {
  bufferGeometryFromBuilder,
  createOpaqueMaterial,
  createOpaqueUniforms,
} from '@sw-file-lib/three';
import * as THREE from 'three';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import {
  getSurfacesFromComponents,
  type BasicComponent,
  type SurfaceEntry,
  type SurfaceRef,
} from '~/shared/basicBlocks';
import { createRaycasterMesh, raycasterIntersections } from '../raycaster';

const components = ref<BasicComponent[]>([
  {
    type: '01_block',
    pos: { x: 0, y: 0, z: 0 },
  },
]);

const surfaces = computed<SurfaceEntry[]>(() => getSurfacesFromComponents(components.value));

const mainObject = shallowRef<THREE.Object3D | null>(null);
const triangleToSurfaceRef = shallowRef<SurfaceRef[]>([]);

const raycasterMesh = shallowRef(
  new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
    }),
  ),
);

watchEffect((onCleanup) => {
  // 事前にカリング
  const culledSurfaceIndices = cullSurfaces(surfaces.value);
  const culledSurfaces = surfaces.value.filter((_, index) => !culledSurfaceIndices.has(index));

  // 表示用 Mesh を作成
  const geometry = bufferGeometryFromBuilder(
    buildSurfacesGeometry(culledSurfaces, { cull: false, edge: true }),
  );
  const material = createOpaqueMaterial(
    createOpaqueUniforms({
      overrideColorEnabled: false,
    }),
  );
  const mesh = new THREE.Mesh(geometry, material);
  mainObject.value = mesh;

  // Raycaster 用の Mesh を作成
  const raycasterMeshData = createRaycasterMesh(culledSurfaces);
  console.log(raycasterMeshData);
  raycasterMesh.value.geometry = raycasterMeshData.geometry;
  triangleToSurfaceRef.value = raycasterMeshData.triangleToSurfaceRef;

  onCleanup(() => {
    geometry.dispose();
    material.dispose();
  });
});

let context: ThreeCanvasContext | null = null;
const raycaster = new THREE.Raycaster();

function testRaycast(event: MouseEvent) {
  if (!context) return null;

  const intersections = raycasterIntersections(
    event,
    raycaster,
    raycasterMesh.value,
    context.renderer.domElement,
    context.camera,
  );

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

function init(newContext: ThreeCanvasContext) {
  context = newContext;
}

function dispose() {
  if (!context) return;
  context = null;
}

onBeforeUnmount(() => {
  raycasterMesh.value.geometry.dispose();
  raycasterMesh.value.material.dispose();
});

function drag(hit: { surfaceRef: SurfaceRef; uv: THREE.Vector2 }) {
  console.log(hit.surfaceRef, hit.uv);
}

function pointerDownHandler(event: PointerEvent) {
  if ((event.buttons & 1) !== 0) {
    const hit = testRaycast(event);
    if (hit) {
      drag(hit);
    }
  }
}

function pointerMoveHandler(event: PointerEvent) {
  if ((event.buttons & 1) !== 0) {
    const hit = testRaycast(event);
    if (hit) {
      drag(hit);
    }
  }
}

function pointerUpHandler(_event: PointerEvent) {}
</script>

<template>
  <div class="grid h-full sm:grid-cols-[24rem_1fr]">
    <div class="flex h-screen flex-col">
      <AppTitle />

      <div class="overflow-auto">
        <pre><code>{{ JSON.stringify(surfaces, null, 2) }}</code></pre>
      </div>
    </div>

    <ResponsivePanel icon="i-lucide-box" label="a">
      <ClientOnly>
        <ThreeCanvas
          :objects="[mainObject, raycasterMesh].filter((o) => o !== null)"
          :initial-camera-pos="[0, 0, -1]"
          @init="init"
          @dispose="dispose"
          @pointer-down="pointerDownHandler"
          @pointer-move="pointerMoveHandler"
          @pointer-up="pointerUpHandler"
        />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>
