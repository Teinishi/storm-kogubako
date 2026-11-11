import type { SurfaceShape } from '../surfaces';
import type { BasicBlockType } from './definitions';

export interface BasicComponent {
  type: BasicBlockType;
  pos: Vec3;
  t?: number;
  r?: string;
  bc?: string;
  sc?: string;
}

export interface SurfaceEntry {
  position: Vec3;
  matrix: Mat3;
  shape: SurfaceShape;
  color: Color;
}

export interface SurfaceEntryWithRef extends SurfaceEntry {
  componentIndex: number;
  surfaceIndex: number;
}
