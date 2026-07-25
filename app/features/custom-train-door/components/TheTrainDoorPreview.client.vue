<script setup lang="ts">
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { BufferGeometry } from 'three';
import { buildBasicBlockGeometry, type BasicBlock } from '../basicBlocks';
import { buildDoorGeometry } from '../doorTypes';
import type { OutputTrainDoorState } from '../types';
import { getVoxelRange } from '../utils';

const props = defineProps<{
  state: DeepReadonly<OutputTrainDoorState>;
}>();

const geometries = shallowRef<{ id: string; geometry: BufferGeometry }[]>([]);
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

const basicBlockGeometry = shallowRef<BufferGeometry | undefined>(undefined);

watchEffect(() => {
  const objects = buildDoorGeometry(props.state);
  geometries.value.forEach((g) => g.geometry.dispose());
  geometries.value = objects.map(({ id, builder }) => {
    const geometry = new BufferGeometry();
    builder.apply(geometry);
    return { id, geometry };
  });
});

watch(
  () => props.state.options,
  () => {
    const { doorWidth, doorHeight, direction } = props.state.options;
    const w = direction === 'double' ? Math.ceil(doorWidth / 2) : doorWidth;

    const voxelRange = getVoxelRange(doorWidth, doorHeight);

    const bottom = voxelRange.min.y - 1;
    const top = voxelRange.max.y + 1;
    const right = voxelRange.min.z - (direction === 'left' ? 1 : w);
    const left = voxelRange.max.z + (direction === 'right' ? 1 : w);

    const blocks: BasicBlock[] = [];

    for (let y = bottom; y <= top; y++) {
      const ry = voxelRange.min.y <= y && y <= voxelRange.max.y;

      for (let z = right; z <= left; z++) {
        const rz = voxelRange.min.z <= z && z <= voxelRange.max.z;
        if (ry && rz) continue;

        blocks.push({ type: 'block', position: { x: 0, y, z } });
      }
    }

    const builder = buildBasicBlockGeometry(blocks, { edge: true });
    const geometry = new BufferGeometry();
    builder.apply(geometry);

    basicBlockGeometry.value?.dispose();
    basicBlockGeometry.value = geometry;
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <MeshViewerCanvas :initial-camera-pos="[-4, 0, 2]">
    <TresMesh
      v-for="item in geometries"
      :key="item.id"
      :geometry="item.geometry"
      :material="materials"
    />
    <TresMesh v-if="basicBlockGeometry" :geometry="basicBlockGeometry" :material="materials" />
  </MeshViewerCanvas>
</template>
