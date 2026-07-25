<script setup lang="ts">
import { OrbitControls } from '@tresjs/cientos';
import { TresCanvas } from '@tresjs/core';
import type { MeshData } from 'sw-mesh-viewer/parser';
import { createStormworksLightGroup, type StormworksUniforms } from 'sw-mesh-viewer/viewer';
import { SwMeshPrimitive } from 'sw-mesh-viewer/vue';
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
  data: MeshData;
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
  initialCameraPos?: [number, number, number]
}>();

const colorMode = useColorMode();
const lights = markRaw(createStormworksLightGroup());
const viewerClearColor = computed(() => (colorMode.value === 'dark' ? '#111827' : '#f9fafb'));
const orbitMouseButtons = {
  LEFT: undefined,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.ROTATE,
};

function hexToVec4(hex: string): [number, number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255, 1];
}

function createObjectUniforms(item: DeepReadonly<MeshViewerCanvasItem>): StormworksUniforms {
  return item.properties.kind === 'mesh'
    ? {
        opaque: {
          overrideColor: {
            type: 'int' as const,
            value: item.properties.enablePaintcolor ? 1 : 0,
          },
          overrideColor1: {
            type: 'vec4' as const,
            value: hexToVec4(item.properties.paintColor1),
          },
          overrideColor2: {
            type: 'vec4' as const,
            value: hexToVec4(item.properties.paintColor2),
          },
          overrideColor3: {
            type: 'vec4' as const,
            value: hexToVec4(item.properties.paintColor3),
          },
        },
      }
    : {};
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
      <SwMeshPrimitive
        :data="item.data"
        :name="item.id"
        :uniforms="createObjectUniforms(item)"
        :visible="item.visible"
        :wireframe="item.wireframe"
      />
    </TresGroup>
    <slot />
  </TresCanvas>
</template>
