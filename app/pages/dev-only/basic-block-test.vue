<script setup lang="ts">
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { BufferGeometry } from 'three';
import { buildBasicBlockGeometry } from '~/features/custom-train-door/basicBlocks';
import testVehicle from './hikouki20_5.json';

definePageMeta({ layout: 'app' });

const geometry = shallowRef<BufferGeometry | undefined>(undefined);
const materialSet = createStormworksMaterials();
const materials = [materialSet.opaque, materialSet.glass, materialSet.additive];

onMounted(() => {
  const builder = new GeometryBuilder();

  // 全 shape を表示
  /*const shapes = Object.keys(SURFACE_SHAPES).map((s) => parseInt(s, 10) as BasicSurfaceShape);
  shapes.sort((a, b) => a - b);

  console.log(
    Array.from({ length: Math.ceil(shapes.length / 8) }, (_, i) =>
      shapes.slice(8 * i, 8 * i + 8).join(' '),
    ).join('\n'),
  );

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i]!;

    builder.merge(
      buildSurfaceGeometry(
        {
          position: { x: 0, y: i % 8, z: Math.floor(i / 8) },
          orientation: 0,
          rotation: 0,
          shape,
        },
        { edge: true },
      ),
    );
  }*/

  // 全 orientation, rotation を表示
  /*for (let rotation = 0; rotation < 4; rotation++) {
    for (let orientation = 0; orientation < 6; orientation++) {
      builder.merge(
        buildSurfaceGeometry(
          {
            position: { x: 4, y: 0, z: 2 * rotation },
            orientation: orientation as BasicSurfaceOrientation,
            rotation: rotation as BasicSurfaceRotation,
            shape: 10,
          },
          { edge: true },
        ),
      );
      builder.merge(
        buildSurfaceGeometry(
          {
            position: { x: 6, y: 0, z: 2 * rotation },
            orientation: orientation as BasicSurfaceOrientation,
            rotation: rotation as BasicSurfaceRotation,
            shape: 10,
          },
          { edge: true },
        ),
      );
      builder.merge(
        buildSurfaceGeometry(
          {
            position: { x: 4, y: 2, z: 2 * rotation },
            orientation: orientation as BasicSurfaceOrientation,
            rotation: rotation as BasicSurfaceRotation,
            shape: 10,
          },
          { edge: true },
        ),
      );
    }
  }*/

  // カリングのテスト
  /*builder.merge(
    buildBasicBlockGeometry(
      [
        { type: 'pyramid2x4', position: { x: 0, y: 0, z: -2 } },
        {
          type: 'pyramid1x2',
          position: { x: 1, y: 0, z: -2 },
          transform: Orientation.RotateZ90.toMatrix3(),
        },
      ],
      { edge: true, hollow: true },
    ),
  );*/

  // カリングのテストにお試しビークルを使用
  builder.merge(
    buildBasicBlockGeometry(
      // @ts-expect-error お試し JSON なのでバリデーションを省略
      testVehicle[0]?.map((b) => {
        const flip = b.flip ?? 0;
        let transform = transposeMat3(b.transform as Mat3);
        if ((flip & 1) !== 0) transform = mulMat3(transform, Orientation.FlipX.toMat3());
        if ((flip & 2) !== 0) transform = mulMat3(transform, Orientation.FlipY.toMat3());
        if ((flip & 4) !== 0) transform = mulMat3(transform, Orientation.FlipZ.toMat3());
        return { ...b, transform };
      }),
      { edge: true, culling: false },
    ),
  );

  const g = new BufferGeometry();
  builder.apply(g);
  geometry.value = g;
});
</script>

<template>
  <div class="h-full w-full">
    <ClientOnly>
      <MeshViewerCanvas :initial-camera-pos="[3, 0, 0]">
        <TresMesh v-if="geometry" :geometry="geometry" :material="materials" />
      </MeshViewerCanvas>
    </ClientOnly>
  </div>
</template>
