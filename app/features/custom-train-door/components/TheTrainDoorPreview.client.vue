<script setup lang="ts">
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import type { TrainDoorState } from '../types/TrainDoorState';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import { buildGeometry } from '../doorTypes';

const props = defineProps<{
  state: TrainDoorState;
  windowHole: Vec2[];
  outsidePaint: PolygonEditorValue;
  insidePaint: PolygonEditorValue;
}>();

const geometries = shallowRef<{ id: string; geometry: BufferGeometry }[]>([]);
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  const objects = buildGeometry(props.state, props.outsidePaint, props.insidePaint);
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
