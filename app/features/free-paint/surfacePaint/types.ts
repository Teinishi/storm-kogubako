import type { BasicComponent } from '~/shared/basicBlocks';

export interface SurfaceRef {
  componentIndex: number;
  surfaceIndex: number;
}

export interface SurfacePaint {
  uSize: number;
  vSize: number;
  colors: Color[][];
}

export interface FreePaintComponent extends BasicComponent {
  surfacePaints?: Record<number, SurfacePaint>;
}
