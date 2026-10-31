<script setup lang="ts">
import type { MeshData, PhysData } from '@sw-file-lib/core';
import type { Color } from '@sw-file-lib/core/color';
import { createSwMaterials, createSwMesh, createSwPhysMeshGroup } from '@sw-file-lib/three';
import type { SwMaterialSet } from '@sw-file-lib/three';
import { Mesh, MeshLambertMaterial, type Material, type Object3D } from 'three';

const props = withDefaults(
  defineProps<{
    data: MeshData | PhysData;
    name?: string;
    visible?: boolean;
    wireframe?: boolean;
    paintColors?: readonly [Color, Color, Color];
  }>(),
  { name: '', visible: true, wireframe: false, paintColors: undefined },
);

const object = shallowRef<Object3D>();
const ownedMaterials = new Set<Material>();
let materials: SwMaterialSet | undefined;

function disposeObject() {
  object.value?.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.geometry.dispose();
  });
  ownedMaterials.forEach((material) => material.dispose());
  ownedMaterials.clear();
  object.value = undefined;
  materials = undefined;
}

watch(
  () => props.data,
  (data) => {
    disposeObject();
    if (data.kind === 'mesh') {
      materials = createSwMaterials({
        uniforms: {
          opaque: { overrideColorEnabled: false },
          additive: { overrideColorEnabled: false },
        },
      });
      ownedMaterials.add(materials.opaque);
      ownedMaterials.add(materials.glass);
      ownedMaterials.add(materials.additive);
      // Preserve the previous viewer's opaque fallback for unknown material indices.
      const mesh = {
        ...data,
        groups: data.groups.map((group) => ({
          ...group,
          materialIndex:
            group.materialIndex === 1 || group.materialIndex === 2 ? group.materialIndex : 0,
        })),
      };
      object.value = createSwMesh(mesh, { materials });
    } else {
      const material = new MeshLambertMaterial({ color: 0xa0a0a0 });
      ownedMaterials.add(material);
      object.value = createSwPhysMeshGroup(data, material);
    }
  },
  { immediate: true },
);

watchEffect(() => {
  if (!object.value) return;
  object.value.name = props.name;
  object.value.visible = props.visible;
  for (const material of ownedMaterials) {
    if ('wireframe' in material) material.wireframe = props.wireframe;
  }

  const colors = props.paintColors;
  materials?.uniforms.opaque.patch({
    overrideColorEnabled: colors !== undefined,
    ...(colors && {
      overrideColor1: colors[0],
      overrideColor2: colors[1],
      overrideColor3: colors[2],
    }),
  });
});

onBeforeUnmount(disposeObject);
</script>

<template>
  <primitive v-if="object" :object="object" :dispose="null" />
</template>
