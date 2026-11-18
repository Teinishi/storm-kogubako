import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ThreeCanvasContext } from '~/components/ThreeCanvas.client.vue';
import { getSurfaceGlobalTransform } from '~/shared/basicBlocks';
import {
  updateRaycaster,
  type FreePaintComponent,
  type PointerEventContext,
  type PointerEventKind,
} from '../surfacePaint';

interface Placement {
  pos: Vec3;
  baseVoxel: Vec3;
  surfaceMatrix: Mat3;
}

function _createGhostBlocks(startPos: Readonly<Vec3>, endPos: Readonly<Vec3>) {
  const blocks: FreePaintComponent[] = [];

  for (let z = startPos.z; z <= endPos.z; z++) {
    for (let y = startPos.y; y <= endPos.y; y++) {
      for (let x = startPos.x; x <= endPos.x; x++) {
        blocks.push({
          type: '01_block',
          pos: { x, y, z },
          r: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        });
      }
    }
  }
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
      pos: addVec3(transform.position, normal),
      baseVoxel: transform.position,
      surfaceMatrix: transform.matrix,
    };
  }

  function getAddBlockDragPos(
    context: ThreeCanvasContext,
    event: MouseEvent,
    startPos: Readonly<Vec3>,
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

    return unscaleVoxelPos(threeToSwVec3(point));
  }

  let dragStart: Placement | null = null;

  function handlePointerEvent(
    kind: PointerEventKind,
    event: PointerEvent,
    placement: Placement,
    components: Ref<FreePaintComponent[]>,
  ) {
    if (kind === 'down' && event.button === 0) {
      dragStart = placement;
    }

    // 面をハイライト表示
    surfaceHighlight.value = swTransformToThreeMat4(
      scaleVoxelPos(placement.baseVoxel),
      placement.surfaceMatrix,
    );

    // ゴーストブロックを表示
    ghostComponents.value = [
      {
        type: '01_block',
        pos: placement.pos,
        r: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      },
    ];

    if (kind === 'up' && event.button === 0) {
      // 左クリックでブロック追加
      components.value.push({
        type: '01_block',
        pos: placement.pos,
        r: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      });
    }
  }

  function _drag(context: ThreeCanvasContext, event: MouseEvent, dragStartPos: Readonly<Vec3>) {
    const _pos = getAddBlockDragPos(context, event, dragStartPos);
  }

  function onPointerEvent(context: PointerEventContext) {
    /*if (dragStart) {
      drag(context.threeContext, context.event, dragStart.pos);
      return;
    }*/

    const hit = context.testRaycast();
    if (hit) {
      const placement = getAddBlockPlacement(
        hit.surfaceRef.componentIndex,
        hit.surfaceRef.surfaceIndex,
        context.components.value,
      );
      if (placement) {
        handlePointerEvent(context.kind, context.event, placement, context.components);
        return;
      }
    }

    reset();
  }

  function reset() {
    ghostComponents.value = [];
    surfaceHighlight.value = null;
    dragStart = null;
  }

  return { ghostComponents, surfaceHighlightObject, onPointerEvent, onDeactivate: reset };
}
