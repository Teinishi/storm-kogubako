import { createSwMaterials, createSwMesh, createSwPhysMeshGroup } from '@sw-file-lib/three';
import type { SwMaterialSet } from '@sw-file-lib/three';
import { Mesh, MeshLambertMaterial, type Material, type Object3D } from 'three';
import type { MeshViewerItem } from '../types';

function createMeshObject(data: MeshViewerItem['data']) {
  const ownedMaterials: Material[] = [];
  let materials: SwMaterialSet | undefined;
  let object: Object3D;
  if (data.kind === 'mesh') {
    materials = createSwMaterials({
      uniforms: {
        opaque: { overrideColorEnabled: false },
        additive: { overrideColorEnabled: false },
      },
    });
    ownedMaterials.push(materials.opaque, materials.glass, materials.additive);
    // Preserve the previous viewer's opaque fallback for unknown material indices.
    const mesh = {
      ...data,
      groups: data.groups.map((group) => ({
        ...group,
        materialIndex:
          group.materialIndex === 1 || group.materialIndex === 2 ? group.materialIndex : 0,
      })),
    };
    object = createSwMesh(mesh, { materials });
  } else {
    const material = new MeshLambertMaterial({ color: 0xa0a0a0 });
    ownedMaterials.push(material);
    object = createSwPhysMeshGroup(data, material);
  }

  return {
    data,
    object,
    update(item: MeshViewerItem) {
      object.name = item.id;
      object.visible = item.visible;
      object.position.set(item.offset.x, item.offset.y, item.offset.z);
      for (const material of ownedMaterials) {
        if ('wireframe' in material) material.wireframe = item.wireframe;
      }
      if (item.properties.kind === 'mesh') {
        materials?.uniforms.opaque.patch({
          overrideColorEnabled: item.properties.enablePaintcolor,
          overrideColor1: hexToRgb(item.properties.paintColor1),
          overrideColor2: hexToRgb(item.properties.paintColor2),
          overrideColor3: hexToRgb(item.properties.paintColor3),
        });
      }
    },
    dispose() {
      object.removeFromParent();
      object.traverse((child) => {
        if (child instanceof Mesh) child.geometry.dispose();
      });
      ownedMaterials.forEach((material) => material.dispose());
    },
  };
}

export function useMeshViewerObjects(items: () => readonly MeshViewerItem[]) {
  const entries = new Map<string, ReturnType<typeof createMeshObject>>();
  const objects = shallowRef<Object3D[]>([]);

  watchEffect(() => {
    const currentIds = new Set<string>();
    const currentObjects: Object3D[] = [];
    for (const item of items()) {
      currentIds.add(item.id);
      const data = toRaw(item.data);
      let entry = entries.get(item.id);
      if (!entry || entry.data !== data) {
        entry?.dispose();
        entry = createMeshObject(data);
        entries.set(item.id, entry);
      }
      entry.update(item);
      currentObjects.push(entry.object);
    }
    for (const [id, entry] of entries) {
      if (currentIds.has(id)) continue;
      entry.dispose();
      entries.delete(id);
    }
    objects.value = currentObjects;
  });

  onBeforeUnmount(() => {
    entries.forEach((entry) => entry.dispose());
    entries.clear();
  });

  return objects;
}
