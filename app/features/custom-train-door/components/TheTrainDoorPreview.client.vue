<script setup lang="ts">
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { BufferGeometry } from 'three';
import type { PolygonEditorPolygon } from '~/features/polygon-editor';
import { buildDoorGeometry } from '../doorTypes';
import type { TrainDoorState } from '../types';

const props = defineProps<{
  state: TrainDoorState;
  outsidePaint: DeepReadonly<PolygonEditorPolygon[]>;
  insidePaint: DeepReadonly<PolygonEditorPolygon[]>;
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
