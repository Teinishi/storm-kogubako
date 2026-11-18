import { Orientation } from '@sw-file-lib/core/math';
import { getSurfaceOrientation } from '@sw-file-lib/geometry';
import { BASIC_BLOCK_SURFACE_DEFINITIONS, type BasicBlockType } from './definitions';

export * from './definitions';
export * from './surfaces';
export * from './types';

export function getComponentMatrix(r: Mat3 | undefined, t: number | undefined): Mat3 {
  let mat: Mat3 = [0, 0, 1, -1, 0, 0, 0, -1, 0];
  if (r !== undefined) {
    mat = r;
  }
  mat = transposeMat3(mat);
  if (t !== undefined) {
    if ((t & 1) !== 0) mat = mulMat3(mat, Orientation.FlipX.toMat3());
    if ((t & 2) !== 0) mat = mulMat3(mat, Orientation.FlipY.toMat3());
    if ((t & 4) !== 0) mat = mulMat3(mat, Orientation.FlipZ.toMat3());
  }

  return mat;
}

export function getSurfaceGlobalTransform(
  type: BasicBlockType,
  surfaceIndex: number,
  componentPosition: Vec3,
  r: Mat3 | undefined,
  t: number | undefined,
): { position: Vec3; matrix: Mat3 } | undefined {
  const surfaceDefinition = BASIC_BLOCK_SURFACE_DEFINITIONS[type]?.[surfaceIndex];
  if (!surfaceDefinition) return;

  const componentMatrix = getComponentMatrix(r, t);

  const localPosition = surfaceDefinition.position;
  const position = addVec3(
    componentMatrix ? mulMat3Vec3(componentMatrix, localPosition) : localPosition,
    componentPosition,
  );

  const matrix = mulMat3(
    componentMatrix,
    getSurfaceOrientation(surfaceDefinition.orientation, surfaceDefinition.rotation ?? 0).toMat3(),
  );

  return { position, matrix };
}
