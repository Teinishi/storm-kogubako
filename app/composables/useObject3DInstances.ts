import type * as THREE from 'three';

export function useObject3DInstances(
  getTemplate: () => THREE.Object3D | null | undefined,
  getMatrices: () => THREE.Matrix4[],
) {
  const objects = shallowRef<THREE.Object3D[]>([]);

  watchEffect(() => {
    const template = getTemplate();
    if (!template) {
      objects.value = [];
      return;
    }

    const matrices = getMatrices();
    const current = objects.value;

    while (current.length < matrices.length) {
      const object = template.clone(true);
      object.matrixAutoUpdate = false;
      current.push(object);
    }

    while (current.length > matrices.length) {
      current.pop()!;
    }

    for (let i = 0; i < matrices.length; i++) {
      current[i]!.matrix.copy(matrices[i]!);
    }

    objects.value = [...current];
  });

  return objects;
}
