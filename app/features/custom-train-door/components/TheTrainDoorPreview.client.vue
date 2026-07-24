<script setup lang="ts">
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { BufferGeometry } from 'three';
import { buildBasicBlockGeometry } from '../basicBlocks';
import { buildDoorGeometry } from '../doorTypes';
import type { OutputTrainDoorState } from '../types';

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
    //const { doorWidth, doorHeight, direction } = props.state.options;
    const builder = buildBasicBlockGeometry([{ type: 'block', position: { x: 0, y: 0, z: 0 } }], {
      edge: true,
    });
    const geometry = new BufferGeometry();
    builder.apply(geometry);

    basicBlockGeometry.value?.dispose();
    basicBlockGeometry.value = geometry;
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <MeshViewerCanvas>
    <TresMesh
      v-for="item in geometries"
      :key="item.id"
      :geometry="item.geometry"
      :material="materials"
    />
    <TresMesh v-if="basicBlockGeometry" :geometry="basicBlockGeometry" :material="materials" />
  </MeshViewerCanvas>
</template>
