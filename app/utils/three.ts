import * as THREE from 'three';

export function swToThreeVec3(v: Readonly<Vec3>): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, -v.z);
}

export function threeToSwVec3(v: Readonly<THREE.Vector3>): Vec3 {
  return { x: v.x, y: v.y, z: -v.z };
}

export function swToThreeMat3(m: Readonly<Mat3>): THREE.Matrix3 {
  return new THREE.Matrix3().set(m[0], m[1], -m[2], m[3], m[4], -m[5], -m[6], -m[7], m[8]);
}

export function swTransformToThreeMat4(pos: Readonly<Vec3>, mat: Readonly<Mat3>): THREE.Matrix4 {
  const m = new THREE.Matrix4();
  m.set(
    mat[0],
    mat[1],
    -mat[2],
    pos.x,
    mat[3],
    mat[4],
    -mat[5],
    pos.y,
    -mat[6],
    -mat[7],
    mat[8],
    -pos.z,
    0,
    0,
    0,
    1,
  );
  return m;
}
