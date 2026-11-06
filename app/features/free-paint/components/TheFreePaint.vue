<script setup lang="ts">
import { createSwMaterials } from '@sw-file-lib/three';
import { Mesh } from 'three';
import {
  buildBasicBlockGeometry,
  createBufferGeometryFromBuilder,
} from '~/features/custom-train-door/basicBlocks';

const materialSet = createSwMaterials({
  uniforms: {
    opaque: { overrideColorEnabled: false },
    additive: { overrideColorEnabled: false },
  },
});
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

const basicBlockMesh = shallowRef<Mesh>();

onMounted(() => {
  const blocks = [{ type: 'block' as const, position: { x: 0, y: 0, z: 0 } }];
  const builder = buildBasicBlockGeometry(blocks, { edge: true });
  const geometry = createBufferGeometryFromBuilder(builder);
  basicBlockMesh.value = new Mesh(geometry, materials);
});
</script>

<template>
  <div class="relative h-full w-full">
    <ClientOnly>
      <ThreeCanvas
        :objects="basicBlockMesh ? [basicBlockMesh] : []"
        :initial-camera-pos="[-2, 0, 1]"
      />
    </ClientOnly>
  </div>
</template>
