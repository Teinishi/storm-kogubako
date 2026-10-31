import type { MeshData, PhysData } from '@sw-file-lib/core';

export interface MeshViewerItem {
  id: string;
  data: MeshData | PhysData;
  visible: boolean;
  wireframe: boolean;
  offset: { x: number; y: number; z: number };
  properties:
    | {
        kind: 'mesh';
        enablePaintcolor: boolean;
        paintColor1: string;
        paintColor2: string;
        paintColor3: string;
      }
    | { kind: 'phys' };
}
