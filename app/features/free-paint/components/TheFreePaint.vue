<script setup lang="ts">
import { createSwMaterials } from '@sw-file-lib/three';
import { Mesh } from 'three';
import {
  buildBasicBlockGeometry,
  createBufferGeometryFromBuilder,
} from '~/features/custom-train-door/basicBlocks';
import TheFreePaintCanvas from './TheFreePaintCanvas.client.vue';

const materialSet = createSwMaterials({
  uniforms: {
    opaque: { overrideColorEnabled: false },
    additive: { overrideColorEnabled: false },
  },
});
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

const basicBlockMesh = shallowRef<Mesh>();

const faces = ref([
  {
    data: 'X+',
    vertices: [
      { x: 0.125, y: -0.125, z: -0.125 },
      { x: 0.125, y: -0.125, z: 0.125 },
      { x: 0.125, y: 0.125, z: 0.125 },
      { x: 0.125, y: 0.125, z: -0.125 },
    ],
  },
  {
    data: 'X-',
    vertices: [
      { x: -0.125, y: -0.125, z: -0.125 },
      { x: -0.125, y: 0.125, z: -0.125 },
      { x: -0.125, y: 0.125, z: 0.125 },
      { x: -0.125, y: -0.125, z: 0.125 },
    ],
  },
  {
    data: 'Y+',
    vertices: [
      { x: -0.125, y: 0.125, z: -0.125 },
      { x: 0.125, y: 0.125, z: -0.125 },
      { x: 0.125, y: 0.125, z: 0.125 },
      { x: -0.125, y: 0.125, z: 0.125 },
    ],
  },
  {
    data: 'Y-',
    vertices: [
      { x: -0.125, y: -0.125, z: -0.125 },
      { x: -0.125, y: -0.125, z: 0.125 },
      { x: 0.125, y: -0.125, z: 0.125 },
      { x: 0.125, y: -0.125, z: -0.125 },
    ],
  },
  {
    data: 'Z+',
    vertices: [
      { x: -0.125, y: -0.125, z: 0.125 },
      { x: -0.125, y: 0.125, z: 0.125 },
      { x: 0.125, y: 0.125, z: 0.125 },
      { x: 0.125, y: -0.125, z: 0.125 },
    ],
  },
  {
    data: 'Z-',
    vertices: [
      { x: -0.125, y: -0.125, z: -0.125 },
      { x: 0.125, y: -0.125, z: -0.125 },
      { x: 0.125, y: 0.125, z: -0.125 },
      { x: -0.125, y: 0.125, z: -0.125 },
    ],
  },
]);

onMounted(() => {
  const blocks = [{ type: 'block' as const, position: { x: 0, y: 0, z: 0 } }];
  const builder = buildBasicBlockGeometry(blocks, { edge: true });
  const geometry = createBufferGeometryFromBuilder(builder);
  basicBlockMesh.value = new Mesh(geometry, materials);
});
</script>

<template>
  <div class="grid h-full sm:grid-cols-[24rem_1fr]">
    <div class="flex h-screen flex-col">
      <AppTitle />

      <div />
    </div>

    <ResponsivePanel icon="i-lucide-box" label="a">
      <ClientOnly>
        <TheFreePaintCanvas
          :objects="basicBlockMesh ? [basicBlockMesh] : []"
          :initial-camera-pos="[0, 0, -1]"
          :faces="faces"
        />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>
