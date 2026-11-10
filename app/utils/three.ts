import * as THREE from 'three';

export function swToThreeVec3(v: Readonly<Vec3>): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, -v.z);
}

export function swToThreeMat3(m: Readonly<Mat3>): THREE.Matrix3 {
  return new THREE.Matrix3().set(m[0], m[1], -m[2], m[3], m[4], -m[5], -m[6], -m[7], m[8]);
}
