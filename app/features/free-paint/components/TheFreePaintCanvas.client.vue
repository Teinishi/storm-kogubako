<script setup lang="ts" generic="T">
import type * as THREE from 'three';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { useFaceHitTester, type FaceDefinition } from '~/composables/three/useFaceHitTester';

const props = withDefaults(
  defineProps<{
    objects: THREE.Object3D[];
    initialCameraPos?: [number, number, number];
    faces?: FaceDefinition<T>[];
  }>(),
  {
    initialCameraPos: () => [1, 1, -1],
    faces: () => [],
  },
);

const faceHitTester = useFaceHitTester(() => props.faces);

function init(context: ThreeCanvasContext) {
  faceHitTester.init(context.scene, context.camera, context.renderer);
}

function dispose(context: ThreeCanvasContext) {
  faceHitTester.dispose(context.scene);
}

function pointerDownHandler(event: PointerEvent) {
  const faceHit = faceHitTester.hitTest(event);
  console.log('pointer-down', faceHit);
}

function pointerUpHandler(event: PointerEvent) {
  const faceHit = faceHitTester.hitTest(event);
  console.log('pointer-up', faceHit);
}
</script>

<template>
  <ThreeCanvas
    :objects="objects"
    :initial-camera-pos="initialCameraPos"
    @init="init"
    @dispose="dispose"
    @pointer-down="pointerDownHandler"
    @pointer-up="pointerUpHandler"
  />
</template>
