<script setup lang="ts">
import polygonClipping from 'polygon-clipping';
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import type { Vec2, Vec3 } from '~/utils/utils';
import { polygonToGeom, rectToGeom, polygonsToDisjointTriangles } from '~/utils/polygonUtils';
import type { PolygonEditorValue } from '~/utils/polygonEditorCore';
import { updateGeometry, updateExtrudedSideGeometry } from '~/utils/polygonRenderUtils.client';
import type { TrainDoorState } from '~/pages/custom-train-door.vue';

const props = defineProps<{
  state: TrainDoorState;
  windowHole: Vec2[];
  polygonEditorValue: PolygonEditorValue;
}>();

const doorZ = computed(() => ({
  front: props.state.doorThickness / 2 + props.state.doorZOffset,
  back: -props.state.doorThickness / 2 + props.state.doorZOffset,
}));

function coordinateConversion({ x, y }: Vec2, z?: number): Vec3 {
  return {
    x: 0.25 * (x - Math.floor(props.state.doorWidth / 2) - 0.5),
    y: 0.25 * (y - Math.floor(props.state.doorHeight / 2) - 0.5),
    z: z ?? 0,
  };
}

const mainGeometry = new BufferGeometry();
const sideGeometry = new BufferGeometry();
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  const rectGeom = rectToGeom({ x: 0, y: 0, width: props.state.doorWidth, height: props.state.doorHeight });
  const windowHole = polygonToGeom(offsetPolygon(props.windowHole, 0.02 / 0.25));
  const baseGeom = polygonClipping.difference(rectGeom, windowHole);

  const { polygons } = props.polygonEditorValue;
  const triangulated = polygonsToDisjointTriangles(polygons, baseGeom);
  updateGeometry(
    mainGeometry,
    triangulated,
    ({ id }) => hexToRgb(polygons.find(v => v.id === id)?.color ?? props.state.baseColor),
    p => coordinateConversion(p, doorZ.value.front),
  );
});

watchEffect(() => {
  const { x: x1, y: y1 } = coordinateConversion({ x: 0, y: 0 });
  const { x: x2, y: y2 } = coordinateConversion({ x: props.state.doorWidth, y: props.state.doorHeight });
  const { front: z1, back: z2 } = doorZ.value;
  const rect = [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ];

  updateExtrudedSideGeometry(sideGeometry, rect, z1, z2, hexToRgb(props.state.baseColor));
});
</script>

<template>
  <MeshViewerCanvas>
    <TresMesh
      :geometry="mainGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="sideGeometry"
      :material="materials"
    />
  </MeshViewerCanvas>
</template>
