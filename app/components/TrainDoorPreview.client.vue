<script setup lang="ts">
import polygonClipping from 'polygon-clipping';
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import type { Vec2, Vec3 } from '~/utils/utils';
import { polygonToGeom, rectToGeom, polygonsToDisjointTriangles, triangulateGeometry } from '~/utils/polygonUtils';
import type { PolygonEditorValue } from '~/utils/polygonEditorCore';
import { updateGeometry, updateExtrudedSideGeometry } from '~/utils/polygonRenderUtils.client';
import type { TrainDoorState } from '~/pages/custom-train-door.vue';

const props = defineProps<{
  state: TrainDoorState;
  windowHole: Vec2[];
  polygonEditorValue: PolygonEditorValue;
}>();

const doorRect = computed(() => ({
  x: 0,
  y: 0,
  width: props.state.doorWidth,
  height: props.state.doorHeight,
}));

const doorZ = computed(() => ({
  front: props.state.doorThickness / 2 + props.state.doorZOffset,
  back: -props.state.doorThickness / 2 + props.state.doorZOffset,
}));

function coordinateConversion(
  p: Vec2,
  options?: { z?: number; flipX?: boolean; flipY?: boolean },
): Vec3 {
  let px = p.x;
  let py = p.y;
  if (options?.flipX) {
    px = props.state.doorWidth - px;
  }
  if (options?.flipY) {
    py = props.state.doorHeight - py;
  }
  const x = 0.25 * (px - Math.floor(props.state.doorWidth / 2) - 0.5);
  const y = 0.25 * (py - Math.floor(props.state.doorHeight / 2) - 0.5);
  return { x, y, z: options?.z ?? 0 };
}

const frontGeometry = new BufferGeometry();
const backGeometry = new BufferGeometry();
const sideGeometry = new BufferGeometry();
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  // frontGeometry の更新
  const rectGeom = rectToGeom(doorRect.value);
  const windowHole = polygonToGeom(offsetPolygon(props.windowHole, 0.02 / 0.25));
  const baseGeom = polygonClipping.difference(rectGeom, windowHole);

  const { polygons } = props.polygonEditorValue;
  const triangulated = polygonsToDisjointTriangles(polygons, { id: -1, geom: baseGeom });
  updateGeometry(
    frontGeometry,
    triangulated.map(({ id, vertices, indices }) => ({
      color: hexToRgb(polygons.find(v => v.id === id)?.color ?? props.state.baseColor),
      vertices,
      indices,
    })),
    p => coordinateConversion(p, { z: doorZ.value.front }),
  );
});

watchEffect(() => {
  // backGeometry の更新
  const rectGeom = rectToGeom(doorRect.value);
  const windowHole = polygonToGeom(offsetPolygon(props.windowHole, 0.02 / 0.25));
  const baseGeom = polygonClipping.difference(rectGeom, windowHole);
  const { vertices, indices } = triangulateGeometry(baseGeom);
  updateGeometry(
    backGeometry,
    [{
      color: hexToRgb(props.state.baseColor),
      vertices,
      indices,
    }],
    p => coordinateConversion(p, { z: doorZ.value.back, flipX: true }),
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
      :geometry="frontGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="backGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="sideGeometry"
      :material="materials"
    />
  </MeshViewerCanvas>
</template>
