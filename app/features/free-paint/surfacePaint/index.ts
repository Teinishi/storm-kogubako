import {
  buildSurfaceGeometry,
  GeometryBuilder,
  type BuildSurfaceGeometryOptions,
} from '@sw-file-lib/geometry';
import type { SurfaceEntryWithRef } from '~/shared/basicBlocks';
import type { SurfaceShape } from '~/shared/surfaces';
import type { FreePaintComponent, SurfacePaintGrid } from './types';
import { getSurfaceData, uvToPosition } from './uv';

export * from './raycaster';
export * from './uv';
export * from './types';

function buildPaintGridGeometry(
  shape: SurfaceShape,
  paint: DeepReadonly<SurfacePaintGrid>,
): GeometryBuilder | null {
  const surfaceData = getSurfaceData(shape);

  const builder = new GeometryBuilder();

  const { uSize, vSize } = paint;
  for (let v = 0; v < uSize; v++) {
    for (let u = 0; u < vSize; u++) {
      const pos0 = uvToPosition(u / uSize, v / vSize, surfaceData.uvMapping);
      const pos1 = uvToPosition((u + 1) / uSize, v / vSize, surfaceData.uvMapping);
      const pos2 = uvToPosition((u + 1) / uSize, (v + 1) / vSize, surfaceData.uvMapping);
      const pos3 = uvToPosition(u / uSize, (v + 1) / vSize, surfaceData.uvMapping);

      const color = paint.colors[v]?.[u];
      builder.addFace([pos0, pos1, pos2, pos3], { color });
    }
  }
  return builder;
}

export function buildFreePaintGeometry(
  surfaces: DeepReadonly<SurfaceEntryWithRef[]>,
  components: DeepReadonly<FreePaintComponent[]>,
  options?: BuildSurfaceGeometryOptions,
): GeometryBuilder {
  const builder = new GeometryBuilder();

  for (const surface of surfaces) {
    const component = components[surface.componentIndex];
    const surfacePaint = component?.surfacePaints?.[surface.surfaceIndex];

    let s: GeometryBuilder | null | undefined;
    if (surfacePaint?.kind === 'paint') {
      s = buildPaintGridGeometry(surface.shape, surfacePaint.paint);
    } else {
      const o = { ...options };
      if (surfacePaint?.color) o.color = surfacePaint.color;
      s = buildSurfaceGeometry(surface.shape, o);
    }
    if (s) {
      s.transform(surface.matrix, scaleSwPosition(surface.position));
      builder.merge(s);
    }
  }

  return builder;
}
