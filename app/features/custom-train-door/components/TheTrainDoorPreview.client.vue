<script setup lang="ts">
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import type { PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { buildDoorGeometry } from '../doorTypes';

const props = defineProps<{
  state: TrainDoorState;
  outsidePaint: PolygonEditorValue;
  insidePaint: PolygonEditorValue;
}>();

const geometries = shallowRef<{ id: string; geometry: BufferGeometry }[]>([]);
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  const objects = buildDoorGeometry(props.state, props.outsidePaint, props.insidePaint);
  geometries.value = objects.map(({ id, builder }) => {
    const geometry = new BufferGeometry();
    builder.apply(geometry);
    return { id, geometry };
  });
});
</script>

<template>
  <MeshViewerCanvas>
    <TresMesh
      v-for="item in geometries"
      :key="item.id"
      :geometry="item.geometry"
      :material="materials"
    />
  </MeshViewerCanvas>
</template>
