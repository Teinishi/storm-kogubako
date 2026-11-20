import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { getSurfaceGlobalTransform } from '~/shared/basicBlocks';
import {
  getVoxelComponentMap,
  updateRaycaster,
  type FreePaintComponent,
  type PointerEventContext,
} from '../surfacePaint';

interface Placement {
  targetVoxel: Vec3;
  baseVoxel: Vec3;
  surfaceMatrix: Mat3;
}

function createGhostBlocks(
  p0: Readonly<Vec3>,
  p1: Readonly<Vec3>,
  filterFn?: (pos: Readonly<Vec3>) => boolean,
) {
  const minX = Math.min(p0.x, p1.x);
  const maxX = Math.max(p0.x, p1.x);
  const minY = Math.min(p0.y, p1.y);
  const maxY = Math.max(p0.y, p1.y);
  const minZ = Math.min(p0.z, p1.z);
  const maxZ = Math.max(p0.z, p1.z);

  const blocks: FreePaintComponent[] = [];

  for (let z = minZ; z <= maxZ; z++) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (filterFn && !filterFn({ x, y, z })) continue;
        blocks.push({
          type: '01_block',
          pos: { x, y, z },
          r: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        });
      }
    }
  }

  return blocks;
}

export function useAddBlockTool() {
  const raycaster = new THREE.Raycaster();

  const surfaceHighlightMaterial = new THREE.MeshBasicMaterial({
    color: 0x32ced9,
    transparent: true,
    opacity: 0.75,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });

  const ghostComponents = ref<FreePaintComponent[]>([]);
  const surfaceHighlightTemplate = shallowRef<THREE.Object3D | null>(null);
  onMounted(async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/meshes/surface_highlight.glb');
    surfaceHighlightTemplate.value = gltf.scene;
  });

  const surfaceHighlight = shallowRef<THREE.Matrix4 | null>(null);
  const surfaceHighlightObject = useObject3DInstances(
    () => {
      const template = surfaceHighlightTemplate.value?.clone(true);
      if (!template) return null;
      template.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.material = surfaceHighlightMaterial;
          object.renderOrder = 100;
        }
      });
      return template;
    },
    () => (surfaceHighlight.value ? [surfaceHighlight.value] : []),
  );

  function updateGhostComponents(newValue: FreePaintComponent[]) {
    if (
      newValue.length !== ghostComponents.value.length ||
      JSON.stringify(newValue) !== JSON.stringify(ghostComponents.value)
    ) {
      ghostComponents.value = newValue;
    }
  }

  function getAddBlockPlacement(
    componentIndex: number,
    surfaceIndex: number,
    components: FreePaintComponent[],
  ): Placement | undefined {
    const component = components[componentIndex];
    if (!component) return;

    const transform = getSurfaceGlobalTransform(
      component.type,
      surfaceIndex,
      component.pos,
      component.r,
      component.t,
    );
    if (!transform) return;

    const normal = mulMat3Vec3(transform.matrix, { x: 1, y: 0, z: 0 });
    return {
      targetVoxel: addVec3(transform.position, normal),
      baseVoxel: transform.position,
      surfaceMatrix: transform.matrix,
    };
  }

  function getAddBlockDragPos(
    context: ThreeCanvasContext,
    event: MouseEvent,
    startPos: THREE.Vector3,
  ): Vec3 | undefined {
    const forward = new THREE.Vector3();
    context.camera.getWorldDirection(forward);
    const absX = Math.abs(forward.x);
    const absY = Math.abs(forward.y);
    const absZ = Math.abs(forward.z);

    let plane: THREE.Plane;
    if (absX >= absY && absX >= absZ) {
      plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -startPos.x);
    } else if (absY >= absX && absY >= absZ) {
      plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -startPos.y);
    } else {
      plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -startPos.z);
    }

    const point = new THREE.Vector3();
    updateRaycaster(event, raycaster, context.renderer.domElement, context.camera);
    raycaster.ray.intersectPlane(plane, point);
    point.addScaledVector(forward, -0.125);

    return unscaleVoxelPos(threeToSwVec3(point));
  }

  let dragStart: Placement | null = null;

  function handlePointerEvent(context: PointerEventContext, placement: Placement) {
    if (context.kind === 'down' && context.event.button === 0) {
      dragStart = placement;
    }

    // 面をハイライト表示
    surfaceHighlight.value = swTransformToThreeMat4(
      scaleVoxelPos(placement.baseVoxel),
      placement.surfaceMatrix,
    );

    updateGhostComponents(createGhostBlocks(placement.targetVoxel, placement.targetVoxel));

    if (context.kind === 'up' && context.event.button === 0) {
      // 左クリックでブロック追加
      context.components.value.push(...ghostComponents.value);
    }
  }

  function drag(context: PointerEventContext, dragStart: Placement): boolean {
    const dragStartSurfacePos = addVec3(
      scaleVoxelPos(dragStart.baseVoxel),
      mulMat3Vec3(dragStart.surfaceMatrix, { x: 0.125, y: 0, z: 0 }),
    );

    const endPos = getAddBlockDragPos(
      context.threeContext,
      context.event,
      swToThreeVec3(dragStartSurfacePos),
    );
    if (!endPos) return false;

    const voxelMap = getVoxelComponentMap(context.components.value);
    updateGhostComponents(
      createGhostBlocks(
        dragStart.targetVoxel,
        endPos,
        (pos) => !voxelMap.has(`${pos.x},${pos.y},${pos.z}`),
      ),
    );

    if ((context.event.buttons & 1) === 0) {
      context.components.value.push(...ghostComponents.value);
      reset();
    }

    return true;
  }

  function onPointerEvent(context: PointerEventContext) {
    let success = false;
    if (dragStart) {
      success = drag(context, dragStart);
    } else {
      const hit = context.testRaycast();
      if (hit) {
        const placement = getAddBlockPlacement(
          hit.surfaceRef.componentIndex,
          hit.surfaceRef.surfaceIndex,
          context.components.value,
        );
        if (placement) {
          handlePointerEvent(context, placement);
          success = true;
        }
      }
    }

    if (!success) {
      reset();
    }
  }

  function reset() {
    updateGhostComponents([]);
    surfaceHighlight.value = null;
    dragStart = null;
  }

  return { ghostComponents, surfaceHighlightObject, onPointerEvent, onDeactivate: reset };
}
