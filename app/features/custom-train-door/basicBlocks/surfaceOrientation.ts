import type { BasicSurfaceOrientation, BasicSurfaceRotation } from './types';

export function getSurfaceOrientation(
  orientation: BasicSurfaceOrientation,
  rotation: BasicSurfaceRotation,
) {
  let o = Orientation.Identity;
  switch (rotation) {
    case 1:
      o = Orientation.RotateX270;
      break;
    case 2:
      o = Orientation.RotateX180;
      break;
    case 3:
      o = Orientation.RotateX90;
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
      o = o.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX270);
      break;
    case 5:
      o = o.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX90);
      break;
  }

  return o;
}

export const ALL_ORIENTATIONS = Array.from({ length: 24 }, (_, i) => {
  const orientation = Math.floor(i / 4) as BasicSurfaceOrientation;
  const rotation = (i % 4) as BasicSurfaceRotation;

  return { orientation, rotation, value: getSurfaceOrientation(orientation, rotation) };
});
