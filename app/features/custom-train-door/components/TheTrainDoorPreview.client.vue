<script setup lang="ts">
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { GeometryBuilder } from '~/utils/geometryBuilder.client';
import type { TrainDoorState } from '../types/TrainDoorState';
import { buildOutsideGeometry, buildInsideGeometry, buildSideGeometry, buildWindowGeometry } from '../utils/customTrainDoor.client';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';

const props = defineProps<{
  state: TrainDoorState;
  windowHole: Vec2[];
  outsidePaint: PolygonEditorValue;
  insidePaint: PolygonEditorValue;
}>();

const outsideGeometry = new BufferGeometry();
const insideGeometry = new BufferGeometry();
const sideGeometry = new BufferGeometry();
const windowGeometry = new BufferGeometry();
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  const builder = new GeometryBuilder();
  buildOutsideGeometry(builder, props.state, props.outsidePaint);
  builder.apply(outsideGeometry);
});

watchEffect(() => {
  const builder = new GeometryBuilder();
  buildInsideGeometry(builder, props.state, props.insidePaint);
  builder.apply(insideGeometry);
});

watchEffect(() => {
  const builder = new GeometryBuilder();
  buildSideGeometry(builder, props.state);
  builder.apply(sideGeometry);
});

watchEffect(() => {
  const builder = new GeometryBuilder();
  buildWindowGeometry(builder, props.state);
  builder.apply(windowGeometry);
});
</script>

<template>
  <MeshViewerCanvas>
    <TresMesh
      :geometry="outsideGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="insideGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="sideGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="windowGeometry"
      :material="materials"
    />
  </MeshViewerCanvas>
</template>
