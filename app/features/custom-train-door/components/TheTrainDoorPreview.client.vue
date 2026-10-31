<script setup lang="ts">
import { createSwMaterials } from '@sw-file-lib/three';
import { Mesh } from 'three';
import {
  buildBasicBlockGeometry,
  createBufferGeometryFromBuilder,
  type BasicBlock,
} from '../basicBlocks';
import { buildDoorGeometry, getDoorGeometryTransform } from '../doorTypes';
import type { OutputTrainDoorState } from '../types';
import { getVoxelRange } from '../utils';

const props = defineProps<{
  state: DeepReadonly<OutputTrainDoorState>;
}>();

const { t } = useI18n({ useScope: 'local' });

const showBlocks = ref(true);
const doorPosition = ref(0);

const meshes = shallowRef<{ id: string; mesh: Mesh }[]>([]);
const materialSet = createSwMaterials({
  uniforms: {
    opaque: { overrideColorEnabled: false },
    additive: { overrideColorEnabled: false },
  },
});
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

const basicBlockMesh = shallowRef<Mesh>();
const previewObjects = computed(() => [
  ...meshes.value.map(({ mesh }) => mesh),
  ...(basicBlockMesh.value ? [basicBlockMesh.value] : []),
]);

watchEffect((onCleanup) => {
  const objects = buildDoorGeometry(props.state);
  const nextMeshes = objects.map(({ id, builder }) => {
    const geometry = createBufferGeometryFromBuilder(builder);
    return { id, mesh: new Mesh(geometry, materials) };
  });
  meshes.value = nextMeshes;
  onCleanup(() => {
    for (const { mesh } of nextMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    }
  });
});

watchEffect(() => {
  const matrices = getDoorGeometryTransform(props.state.options, doorPosition.value);

  for (const { id, mesh } of meshes.value) {
    const matrix = matrices[id];
    if (!matrix) continue;

    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(matrix);
    mesh.matrixWorldNeedsUpdate = true;
  }
});

watchEffect((onCleanup) => {
  const { doorWidth, doorHeight, direction } = props.state.options;

  let geometry = null;
  if (showBlocks.value) {
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
    geometry = createBufferGeometryFromBuilder(builder);
  }

  const mesh = geometry ? new Mesh(geometry, materials) : undefined;
  basicBlockMesh.value = mesh;
  onCleanup(() => {
    mesh?.removeFromParent();
    geometry?.dispose();
  });
});

onBeforeUnmount(() => {
  materials.forEach((material) => material.dispose());
});
</script>

<template>
  <div class="relative h-full w-full">
    <ClientOnly>
      <MeshViewerCanvas :objects="previewObjects" :initial-camera-pos="[-4, 0, 2]" />
    </ClientOnly>

    <div
      class="absolute top-4 right-4 w-50 space-y-3 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800"
    >
      <USwitch v-model="showBlocks" :label="t('show_blocks')" />

      <UFormField :label="t('door_position')">
        <USlider v-model="doorPosition" :min="0" :max="1" :step="0.0001" class="my-3" />
      </UFormField>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "show_blocks": "Show Blocks",
    "door_position": "Door Position"
  },
  "ja": {
    "show_blocks": "ブロック表示",
    "door_position": "ドア開閉"
  }
}
</i18n>
