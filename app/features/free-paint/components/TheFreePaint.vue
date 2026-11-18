<script setup lang="ts">
import * as THREE from 'three';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { useAddBlockTool } from '../composables/useAddBlockTool.ts';
import { useFreePaintMeshes } from '../composables/useFreePaintMeshes.ts';
import { usePaintTool } from '../composables/usePaintTool.ts';
import {
  createCheckerPattern,
  type FreePaintComponent,
  type PointerEventContext,
  type PointerEventKind,
} from '../surfacePaint';
import TheBottomBar, { type FreePaintTool } from './TheBottomBar.vue';
import ThePaintSidebar from './ThePaintSidebar.vue';

// ツール状態
const tool = ref<FreePaintTool>('paint');
const paintTool = usePaintTool();
const { mode: paintMode, color: paintColor } = paintTool;
const addBlockTool = useAddBlockTool();
const { ghostComponents, surfaceHighlightObject } = addBlockTool;

// 編集状態
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

// 表示 Mesh と Raycaster
const meshes = useFreePaintMeshes(
  () => [...components.value, ...ghostComponents.value],
  () => components.value,
);
const { mainObject, raycasterMesh } = meshes;

// three.js の scene, renderer, camera, controls を保持
let threeContext: ThreeCanvasContext | null = null;
function init(newContext: ThreeCanvasContext) {
  threeContext = newContext;
}
function dispose() {
  threeContext = null;
}

// ツールのイベント
watch(tool, (_newValue, oldValue) => {
  if (oldValue === 'addBlocks') {
    addBlockTool.onDeactivate();
  }
});

function createPointerEventHandler(kind: PointerEventKind) {
  return (event: PointerEvent) => {
    if (!threeContext) return;

    const ctx: PointerEventContext = {
      kind,
      threeContext,
      event,
      components,
      testRaycast: () => {
        if (!threeContext) return null;
        return meshes.testRaycast(threeContext, event);
      },
    };

    switch (tool.value) {
      case 'paint':
        paintTool.onPointerEvent(ctx);
        break;
      case 'addBlocks':
        addBlockTool.onPointerEvent(ctx);
        break;
    }

    event.preventDefault();
  };
}

const pointerDownHandler = createPointerEventHandler('down');
const pointerMoveHandler = createPointerEventHandler('move');
const pointerUpHandler = createPointerEventHandler('up');

const axesHelper = new THREE.AxesHelper(5);
</script>

<template>
  <div class="relative h-full w-full">
    <ClientOnly>
      <ThreeCanvas
        :objects="
          [mainObject, raycasterMesh, axesHelper, ...surfaceHighlightObject].filter(
            (o) => o !== null,
          )
        "
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
      v-model:color="paintColor"
      class="absolute top-1/2 left-0 -translate-y-1/2"
      :disabled="tool !== 'paint'"
    />
    <TheBottomBar v-model:tool="tool" class="absolute bottom-0 left-0 w-full" />
  </div>
</template>
