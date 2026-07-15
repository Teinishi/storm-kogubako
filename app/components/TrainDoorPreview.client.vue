<script setup lang="ts">
import polygonClipping from 'polygon-clipping';
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { type Vec2, type Vec3, hexToRgb, lerp } from '~/utils/utils';
import { polygonToGeom, rectToGeom, polygonsToDisjointTriangles, triangulate } from '~/utils/polygonUtils';
import type { PolygonEditorValue } from '~/utils/polygonEditorCore';
import { updateGeometry } from '~/utils/polygonRenderUtils.client';
import { GeometryBuilder } from '~/utils/geometryBuilder.client';
import type { TrainDoorState } from '~/pages/custom-train-door.vue';

const WINDOW_FRAME_WIDTH = 0.02;
const WINDOW_FRAME_COLOR = '#545454';

const props = defineProps<{
  state: TrainDoorState;
  windowHole: Vec2[];
  polygonEditorValue: PolygonEditorValue;
}>();

const doorRect = computed(() => {
  const rubber = props.state.rubberThickness / 0.25;
  return {
    x: rubber,
    y: 0,
    width: props.state.doorWidth - rubber,
    height: props.state.doorHeight,
  };
});

const doorZ = computed(() => ({
  front: props.state.doorThickness / 2 + props.state.doorZOffset,
  back: -props.state.doorThickness / 2 + props.state.doorZOffset,
}));

function coordinateConversion(p: Vec2, z?: number): Vec3 {
  const x = 0.25 * (p.x - Math.floor(props.state.doorWidth / 2) - 0.5);
  const y = 0.25 * (p.y - Math.floor(props.state.doorHeight / 2) - 0.5);
  return { x, y, z: z ?? 0 };
}

const frontGeometry = new BufferGeometry();
const backGeometry = new BufferGeometry();
const sideGeometry = new BufferGeometry();
const rubberGeometry = new BufferGeometry();
const windowGeometry = new BufferGeometry();
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

watchEffect(() => {
  // frontGeometry の更新
  const rectGeom = rectToGeom(doorRect.value);
  const windowHole = polygonToGeom(offsetPolygon(props.windowHole, WINDOW_FRAME_WIDTH / 0.25));
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
    {
      coordinateConversion: p => coordinateConversion(p, doorZ.value.front),
    },
  );
});

watchEffect(() => {
  // backGeometry の更新
  const rectGeom = rectToGeom(doorRect.value);
  const windowHole = polygonToGeom(offsetPolygon(props.windowHole, WINDOW_FRAME_WIDTH / 0.25));
  const baseGeom = polygonClipping.difference(rectGeom, windowHole);
  const { vertices, indices } = triangulate(baseGeom);
  updateGeometry(
    backGeometry,
    [{
      color: hexToRgb(props.state.baseColor),
      vertices,
      indices,
    }],
    {
      coordinateConversion: p => coordinateConversion(p, doorZ.value.back),
      flip: true,
    },
  );
});

watchEffect(() => {
  // sideGeometry の更新
  const { front: z1, back: z2 } = doorZ.value;
  const rect = doorRect.value;

  const path = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  const builder = new GeometryBuilder();
  builder.addExtrudedSide(
    path.map(coordinateConversion),
    {
      zRange: [z1, z2],
      color: hexToRgb(props.state.baseColor),
    },
  );
  builder.apply(sideGeometry);
});

watchEffect(() => {
  // rubberGeometry の更新
  const color = hexToRgb(props.state.rubberColor);

  const { x: x1, y: y1 } = coordinateConversion({ x: 0, y: 0 });
  const { x: x2, y: y2 } = coordinateConversion({ x: props.state.rubberThickness / 0.25, y: props.state.doorHeight });
  const { front: z1, back: z2 } = doorZ.value;
  const z1i = lerp(z1, z2, 0.2);
  const z2i = lerp(z2, z1, 0.2);

  const v0 = { x: x1, y: y1, z: z1i };
  const v1 = { x: x2, y: y1, z: z1 };
  const v2 = { x: x2, y: y2, z: z1 };
  const v3 = { x: x1, y: y2, z: z1i };
  const v4 = { x: x1, y: y1, z: z2i };
  const v5 = { x: x2, y: y1, z: z2 };
  const v6 = { x: x2, y: y2, z: z2 };
  const v7 = { x: x1, y: y2, z: z2i };

  const builder = new GeometryBuilder();
  builder.addFace([v0, v1, v2, v3], color);
  builder.addFace([v3, v2, v6, v7], color);
  builder.addFace([v7, v6, v5, v4], color);
  builder.addFace([v4, v5, v1, v0], color);
  builder.addFace([v0, v3, v7, v4], color);

  builder.apply(rubberGeometry);
});

watchEffect(() => {
  // windowGeometry の更新
  const color = hexToRgb(WINDOW_FRAME_COLOR);
  const { front: z1, back: z2 } = doorZ.value;
  const innerRing = props.windowHole.map(coordinateConversion);
  const outerRing = offsetPolygon(innerRing, WINDOW_FRAME_WIDTH);

  const builder = new GeometryBuilder();
  builder.addPolygon(
    outerRing,
    { holes: [innerRing], z: z1, color },
  );
  builder.addPolygon(
    outerRing,
    { holes: [innerRing], z: z2, color, flip: true },
  );
  builder.addExtrudedSide(
    innerRing,
    { close: true, zRange: [z2, z1], color },
  );
  builder.addPolygon(
    innerRing,
    { z: z1, materialIndex: 1 },
  );
  builder.addPolygon(
    innerRing,
    { z: z1 - 0.02, materialIndex: 1, flip: true },
  );
  builder.apply(windowGeometry);
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
    <TresMesh
      :geometry="rubberGeometry"
      :material="materials"
    />
    <TresMesh
      :geometry="windowGeometry"
      :material="materials"
    />
  </MeshViewerCanvas>
</template>
