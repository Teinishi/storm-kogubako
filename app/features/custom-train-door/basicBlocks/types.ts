import type { BasicBlockType } from './block';
import type { BasicSurfaceShape } from './surface';

export interface BasicBlock {
  type: BasicBlockType;
  position: Vec3;
  transform?: Mat3;
}

export type BasicSurfaceOrientation = 0 | 1 | 2 | 3 | 4 | 5;
export type BasicSurfaceRotation = 0 | 1 | 2 | 3;

export interface BasicSurface {
  position: Vec3;
  orientation: BasicSurfaceOrientation;
  rotation: BasicSurfaceRotation;
  shape: BasicSurfaceShape;
}
