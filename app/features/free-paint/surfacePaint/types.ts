import type { BasicBlockType, BasicComponent } from '~/shared/basicBlocks';

export interface SurfaceRef {
  componentIndex: number;
  surfaceIndex: number;
}

export interface SurfacePaintGrid {
  uSize: number;
  vSize: number;
  colors: Color[][];
}

export type SurfacePaint =
  | {
      kind: 'paint';
      paint: SurfacePaintGrid;
    }
  | {
      kind: 'singleColor';
      color: Color;
    };

export interface FreePaintComponent {
  type: BasicBlockType;
  pos: Vec3;
  t?: number;
  r?: Mat3;
  surfacePaints?: Record<number, SurfacePaint>;
}

export function freePaintToBasicComponent(component: FreePaintComponent): BasicComponent {
  const { type, pos, t, r } = component;

  return {
    type,
    pos,
    t,
    r: r?.join(','),
  };
}
