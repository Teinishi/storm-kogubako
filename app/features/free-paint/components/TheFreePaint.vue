<script setup lang="ts">
import { cullSurfaces } from '@sw-file-lib/geometry';
import {
  bufferGeometryFromBuilder,
  createOpaqueMaterial,
  createOpaqueUniforms,
} from '@sw-file-lib/three';
import * as THREE from 'three';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { getSurfacesFromComponents, type SurfaceEntryWithRef } from '~/shared/basicBlocks';
import {
  buildFreePaintGeometry,
  createRaycasterMesh,
  freePaintToBasicComponent,
  raycasterIntersections,
  type FreePaintComponent,
  type SurfacePaintGrid,
  type SurfaceRef,
} from '../surfacePaint';
import TheBottomBar, { type FreePaintTool } from './TheBottomBar.vue';
import ThePaintSidebar, { type PaintMode } from './ThePaintSidebar.vue';

function createCheckerPattern(uSize: number, vSize: number): Color[][] {
  const colors: Color[][] = [];
  for (let v = 0; v < vSize; v++) {
    const row: Color[] = [];
    for (let u = 0; u < uSize; u++) {
      const isBlack = (u + v) % 2 === 0;
      row.push(isBlack ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 });
    }
    colors.push(row);
  }
  return colors;
}

function createSurfacePaint(
  uSize: number,
  vSize: number,
  color: Readonly<Color>,
): SurfacePaintGrid {
  return {
    uSize,
    vSize,
    colors: Array.from({ length: vSize }, () =>
      Array.from({ length: uSize }, () => ({ ...color })),
    ),
  };
}

const tool = ref<FreePaintTool>('paint');
const paintMode = ref<PaintMode>('pixel');
const currentColor = ref<string>('#FFFFFF');
const currentColorRgb = computed(() => hexToRgb(currentColor.value) ?? { r: 255, g: 255, b: 255 });

const components = ref<FreePaintComponent[]>([
  {
    type: '01_block',
    pos: { x: 0, y: 0, z: 0 },
    r: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    surfacePaints: {
      2: {
        kind: 'paint',
        paint: { uSize: 9, vSize: 9, colors: createCheckerPattern(9, 9) },
      },
    },
  },
]);

const surfaces = computed<SurfaceEntryWithRef[]>(() =>
  getSurfacesFromComponents(components.value.map(freePaintToBasicComponent)),
);

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
  const visibleSurfaces = surfaces.value.filter((_, index) => !culledSurfaceIndices.has(index));

  // 表示用 Mesh を作成
  const builder = buildFreePaintGeometry(visibleSurfaces, components.value, {
    cull: false,
    edge: true,
  });
  const geometry = bufferGeometryFromBuilder(builder);
  mainObject.value.geometry = geometry;

  // Raycaster 用の Mesh を作成
  const raycasterMeshData = createRaycasterMesh(visibleSurfaces);
  raycasterMesh.value.geometry = raycasterMeshData.geometry;
  triangleToSurfaceRef.value = raycasterMeshData.triangleToSurfaceRef;

  onCleanup(() => {
    geometry.dispose();
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

function dragPaint(hit: { surfaceRef: SurfaceRef; uv: THREE.Vector2 }) {
  const { componentIndex, surfaceIndex } = hit.surfaceRef;

  const component = components.value[componentIndex];
  if (!component) return;
  component.surfacePaints ??= {};

  if (paintMode.value === 'pixel') {
    if (component.surfacePaints[surfaceIndex]?.kind !== 'paint') {
      const color = component.surfacePaints[surfaceIndex]?.color ?? { r: 255, g: 255, b: 255 };
      component.surfacePaints[surfaceIndex] = {
        kind: 'paint',
        paint: createSurfacePaint(9, 9, color),
      };
    }
    const paint = component.surfacePaints[surfaceIndex].paint;
    const u = Math.floor(hit.uv.x * paint.uSize);
    const v = Math.floor(hit.uv.y * paint.vSize);
    if (u < 0 || u >= paint.uSize || v < 0 || v >= paint.vSize) return;
    paint.colors[v]![u]! = { ...currentColorRgb.value };
    if (isSingleColor(paint.colors)) {
      component.surfacePaints[surfaceIndex] = {
        kind: 'singleColor',
        color: { ...currentColorRgb.value },
      };
    }
  } else if (paintMode.value === 'surface') {
    component.surfacePaints[surfaceIndex] = {
      kind: 'singleColor',
      color: { ...currentColorRgb.value },
    };
  }
}

function isSingleColor(colors: Color[][]): boolean {
  if (colors.length === 0) return true;
  const firstColor = colors[0]![0]!;
  for (const row of colors) {
    for (const color of row) {
      if (color.r !== firstColor.r || color.g !== firstColor.g || color.b !== firstColor.b) {
        return false;
      }
    }
  }
  return true;
}

function pointerDownHandler(event: PointerEvent) {
  if ((event.buttons & 1) !== 0) {
    const hit = testRaycast(event);
    if (hit) {
      dragPaint(hit);
    }
  }
}

function pointerMoveHandler(event: PointerEvent) {
  if ((event.buttons & 1) !== 0) {
    const hit = testRaycast(event);
    if (hit) {
      dragPaint(hit);
    }
  }
}

function pointerUpHandler(_event: PointerEvent) {}

const axesHelper = new THREE.AxesHelper(5);
</script>

<template>
  <div class="relative h-full w-full">
    <ClientOnly>
      <ThreeCanvas
        :objects="[mainObject, raycasterMesh, axesHelper].filter((o) => o !== null)"
        :initial-camera-pos="[-1, 1, -1]"
        @init="init"
        @dispose="dispose"
        @pointer-down="pointerDownHandler"
        @pointer-move="pointerMoveHandler"
        @pointer-up="pointerUpHandler"
      />
    </ClientOnly>
    <AppTitle class="absolute top-0 left-0" />
    <ThePaintSidebar
      v-model:mode="paintMode"
      v-model:color="currentColor"
      class="absolute top-1/2 left-0 -translate-y-1/2"
      :disabled="tool !== 'paint'"
    />
    <TheBottomBar v-model:tool="tool" class="absolute bottom-0 left-0 w-full" />
  </div>
</template>
