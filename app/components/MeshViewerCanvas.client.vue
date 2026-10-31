<script setup lang="ts">
import type { MeshData, PhysData } from '@sw-file-lib/core';
import { createSwLightGroup } from '@sw-file-lib/three';
import { OrbitControls } from '@tresjs/cientos';
import { TresCanvas } from '@tresjs/core';
import * as THREE from 'three';
import { markRaw } from 'vue';

type MeshViewerCanvasItemProperties =
  | {
      kind: 'mesh';
      enablePaintcolor: boolean;
      paintColor1: string;
      paintColor2: string;
      paintColor3: string;
    }
  | {
      kind: 'phys';
    };

interface MeshViewerCanvasItem {
  id: string;
  data: MeshData | PhysData;
  visible: boolean;
  wireframe: boolean;
  offset: {
    x: number;
    y: number;
    z: number;
  };
  properties: MeshViewerCanvasItemProperties;
}

defineProps<{
  items?: MeshViewerCanvasItem[];
  initialCameraPos?: [number, number, number];
}>();

const colorMode = useColorMode();
const lights = markRaw(createSwLightGroup());
const viewerClearColor = computed(() => (colorMode.value === 'dark' ? '#111827' : '#f9fafb'));
const orbitMouseButtons = {
  LEFT: undefined,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.ROTATE,
};

function getPaintColors(item: DeepReadonly<MeshViewerCanvasItem>) {
  if (item.properties.kind !== 'mesh' || !item.properties.enablePaintcolor) return undefined;

  return [
    hexToRgb(item.properties.paintColor1),
    hexToRgb(item.properties.paintColor2),
    hexToRgb(item.properties.paintColor3),
  ] as const;
}
</script>

<template>
  <TresCanvas
    :clear-color="viewerClearColor"
    :antialias="true"
    :window-size="false"
    class="h-full w-full"
  >
    <!-- @vue-expect-error -->
    <TresPerspectiveCamera :position="initialCameraPos" :fov="70" />
    <OrbitControls :enable-damping="false" :mouse-buttons="orbitMouseButtons" />
    <primitive :object="lights" />
    <!-- @vue-expect-error -->
    <TresGroup
      v-for="item in items ?? []"
      :key="item.id"
      :position="[item.offset.x, item.offset.y, item.offset.z]"
    >
      <StormworksMesh
        :data="item.data"
        :name="item.id"
        :paint-colors="getPaintColors(item)"
        :visible="item.visible"
        :wireframe="item.wireframe"
      />
    </TresGroup>
    <slot />
  </TresCanvas>
</template>
