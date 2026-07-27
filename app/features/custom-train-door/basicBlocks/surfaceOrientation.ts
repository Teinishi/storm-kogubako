import type { BasicSurfaceOrientation, BasicSurfaceRotation } from './types';

// <surface> の orientation と rotation から Orientation オブジェクトへ変換
// .toMat3() をつければ行列に
export function getSurfaceOrientation(
  orientation: BasicSurfaceOrientation,
  rotation: BasicSurfaceRotation,
) {
  let o = Orientation.Identity;
  switch (rotation) {
    case 1:
      o = Orientation.RotateX90;
      break;
    case 2:
      o = Orientation.RotateX180;
      break;
    case 3:
      o = Orientation.RotateX270;
      break;
  }

  switch (orientation) {
    case 1:
      o = o.multiply(Orientation.RotateZ180);
      break;
    case 2:
      o = o.multiply(Orientation.RotateZ90);
      break;
    case 3:
      o = o.multiply(Orientation.RotateZ270);
      break;
    case 4:
      o = o.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX90);
      break;
    case 5:
      o = o.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX270);
      break;
  }

  return o;
}
