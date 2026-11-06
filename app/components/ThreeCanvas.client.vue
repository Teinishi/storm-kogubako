<script setup lang="ts">
import { createSwLightGroup } from '@sw-file-lib/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const props = withDefaults(
  defineProps<{
    objects: THREE.Object3D[];
    initialCameraPos?: [number, number, number];
  }>(),
  { initialCameraPos: () => [1, 1, -1] },
);

const container = useTemplateRef<HTMLDivElement>('container');
const colorMode = useColorMode();
let context:
  | {
      scene: THREE.Scene;
      renderer: THREE.WebGLRenderer;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
    }
  | undefined;
let resizeObserver: ResizeObserver | undefined;
let animationFrame: number | undefined;
const managedObjects = new Set<THREE.Object3D>();
let hasSize = false;

function syncObjects() {
  if (!context) return;
  const currentObjects = new Set(props.objects);
  for (const object of managedObjects) {
    if (currentObjects.has(object)) continue;
    context.scene.remove(object);
    managedObjects.delete(object);
  }
  for (const object of currentObjects) {
    if (object.parent !== context.scene) context.scene.add(object);
    managedObjects.add(object);
  }
}

function updateBackground() {
  context?.renderer.setClearColor(colorMode.value === 'dark' ? '#111827' : '#f9fafb');
}

function resize() {
  if (!context || !container.value) return;
  const { clientWidth: width, clientHeight: height } = container.value;
  hasSize = width > 0 && height > 0;
  if (!hasSize) return;
  context.camera.aspect = width / height;
  context.camera.updateProjectionMatrix();
  context.renderer.setPixelRatio(window.devicePixelRatio);
  context.renderer.setSize(width, height, false);
}

function animate() {
  animationFrame = requestAnimationFrame(animate);
  if (!context || !hasSize) return;
  if (context.renderer.getPixelRatio() !== window.devicePixelRatio) resize();
  context.controls.update();
  context.renderer.render(context.scene, context.camera);
}

function preventDefault(event: Event) {
  event.preventDefault();
}

function init(element: HTMLDivElement) {
  if (context) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  camera.position.set(...props.initialCameraPos);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.addEventListener('pointerdown', preventDefault);
  canvas.addEventListener('auxclick', preventDefault);
  element.appendChild(canvas);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.mouseButtons.LEFT = undefined;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
  controls.update();
  scene.add(createSwLightGroup());

  context = { scene, renderer, camera, controls };
  syncObjects();
  updateBackground();
  resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  animate();
}

// Nuxt client-only hydration can mount before the actual template is rendered.
watch(
  container,
  (element) => {
    if (element) init(element);
  },
  { flush: 'post' },
);

watch(() => props.objects, syncObjects);
watch(() => colorMode.value, updateBackground);

onBeforeUnmount(() => {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  resizeObserver?.disconnect();
  if (!context) return;
  const { scene, renderer, controls } = context;
  controls.dispose();
  renderer.domElement.removeEventListener('pointerdown', preventDefault);
  renderer.domElement.removeEventListener('auxclick', preventDefault);
  // Geometry and materials belong to the callers; only detach their objects here.
  scene.clear();
  managedObjects.clear();
  renderer.dispose();
  renderer.domElement.remove();
  context = undefined;
});
</script>

<template>
  <div ref="container" class="h-full min-h-0 w-full min-w-0 overflow-hidden" />
</template>
