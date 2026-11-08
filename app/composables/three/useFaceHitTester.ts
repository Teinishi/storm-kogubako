import * as THREE from 'three';

export interface FaceDefinition<T> {
  data: T;
  vertices: Vec3[];
}

export interface FaceHit<T> {
  data: T;
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

export function useFaceHitTester<T>(faces: () => FaceDefinition<T>[]) {
  let context:
    | {
        scene: THREE.Scene;
        camera: THREE.Camera;
        renderer: THREE.WebGLRenderer;
      }
    | undefined;

  const hitMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      colorWrite: false,
      depthWrite: false,
    }),
  );
  let triangleToFaceData: T[] = [];

  watch(
    faces,
    (faces) => {
      const positions: number[] = [];
      const newTriangleToFaceData: T[] = [];

      for (const face of faces) {
        const vertices = face.vertices;

        if (vertices.length < 3) continue;

        // 頂点0を基準に三角形分割
        for (let i = 2; i < vertices.length; i++) {
          const triangle = [vertices[0]!, vertices[i - 1]!, vertices[i]!];

          for (const v of triangle) {
            positions.push(v.x, v.y, v.z);
          }

          newTriangleToFaceData.push(face.data);
        }
      }

      const geometry = new THREE.BufferGeometry();

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      geometry.computeVertexNormals();

      const oldGeometry = hitMesh.geometry;
      hitMesh.geometry = geometry;
      oldGeometry.dispose();

      triangleToFaceData = newTriangleToFaceData;
    },
    {
      immediate: true,
      deep: true,
    },
  );

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function hitTest(event: MouseEvent): FaceHit<T> | null {
    if (!context) return null;

    const rect = context.renderer.domElement.getBoundingClientRect();
    if (!rect) return null;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, context.camera);

    const intersections = raycaster.intersectObject(hitMesh);

    if (intersections.length === 0) return null;

    const intersection = intersections[0]!;
    const faceIndex = intersection.faceIndex;

    if (faceIndex == null) return null;

    const faceData = triangleToFaceData[faceIndex];

    if (faceData === undefined) return null;

    // ローカル法線をワールド法線に変換
    const normal = intersection
      .face!.normal.clone()
      .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld))
      .normalize();

    return {
      data: faceData,
      point: intersection.point.clone(),
      normal,
    };
  }

  return {
    init(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
      context = { scene, camera, renderer };
      scene.add(hitMesh);
    },
    dispose(scene: THREE.Scene) {
      scene.remove(hitMesh);
      hitMesh.geometry.dispose();
      hitMesh.material.dispose();
    },
    hitTest,
  };
}
