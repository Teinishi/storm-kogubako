import { GeometryBuilder } from '@sw-file-lib/geometry';
import type { SurfaceEntry } from '~/shared/basicBlocks';
import type { SurfacePaint } from './types';
import { getSurfaceData, uvToPosition } from './uv';

export * from './raycaster';
export * from './uv';
export * from './types';

export function buildSurfacePaintGeometry(
  surface: SurfaceEntry,
  surfacePaint: SurfacePaint,
): GeometryBuilder | null {
  const surfaceData = getSurfaceData(surface.shape);

  const builder = new GeometryBuilder();

  const { uSize, vSize } = surfacePaint;
  for (let v = 0; v < uSize; v++) {
    for (let u = 0; u < vSize; u++) {
      const pos0 = uvToPosition(u / uSize, v / vSize, surfaceData.uvMapping);
      const pos1 = uvToPosition((u + 1) / uSize, v / vSize, surfaceData.uvMapping);
      const pos2 = uvToPosition((u + 1) / uSize, (v + 1) / vSize, surfaceData.uvMapping);
      const pos3 = uvToPosition(u / uSize, (v + 1) / vSize, surfaceData.uvMapping);

      const color = surfacePaint.colors[v]?.[u];
      builder.addFace([pos0, pos1, pos2, pos3], { color });
    }
  }

  builder.transform(surface.matrix, scaleSwPosition(surface.position));
  return builder;
}
