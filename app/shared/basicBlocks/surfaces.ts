import { parseColor } from '@sw-file-lib/core/color';
import { parseMat3, Orientation, vec3 } from '@sw-file-lib/core/math';
import { getSurfaceOrientation } from '@sw-file-lib/geometry';
import { BASIC_BLOCK_SURFACE_DEFINITIONS } from './definitions';
import type { BasicComponent, SurfaceEntryWithRef } from './types';

export function getSurfacesFromComponents(components: BasicComponent[]): SurfaceEntryWithRef[] {
  const surfaces = [];

  for (const [componentIndex, component] of components.entries()) {
    const { type, pos: componentPos, r, t } = component;

    let componentMatrix: Mat3 = [0, 0, 1, -1, 0, 0, 0, -1, 0];
    if (r !== undefined) {
      componentMatrix = parseMat3(r) ?? componentMatrix;
    }
    componentMatrix = transposeMat3(componentMatrix);
    if (t !== undefined) {
      if ((t & 1) !== 0) componentMatrix = mulMat3(componentMatrix, Orientation.FlipX.toMat3());
      if ((t & 2) !== 0) componentMatrix = mulMat3(componentMatrix, Orientation.FlipY.toMat3());
      if ((t & 4) !== 0) componentMatrix = mulMat3(componentMatrix, Orientation.FlipZ.toMat3());
    }

    const blockColor = parseColor(component.bc ?? 'x', { r: 255, g: 255, b: 255 });
    const surfaceColors =
      component.sc
        ?.split(',')
        .slice(1)
        .map((c) => parseColor(c)) ?? [];

    const surfaceDef = BASIC_BLOCK_SURFACE_DEFINITIONS[type];

    for (const [surfaceIndex, surface] of surfaceDef.entries()) {
      const orientation = surface.orientation ?? 0;
      const rotation = surface.rotation ?? 0;
      const shape = surface.shape ?? 0;

      const localPosition = vec3(surface.position);
      const position = addVec3(
        componentMatrix ? mulMat3Vec3(componentMatrix, localPosition) : localPosition,
        componentPos,
      );

      const matrix = mulMat3(
        componentMatrix,
        getSurfaceOrientation(orientation, rotation).toMat3(),
      );

      surfaces.push({
        componentIndex,
        surfaceIndex,
        position,
        matrix,
        shape,
        color: surfaceColors[surfaceIndex] ?? blockColor,
      });
    }
  }

  return surfaces;
}
