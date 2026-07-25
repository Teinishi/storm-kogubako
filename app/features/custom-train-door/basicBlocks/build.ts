import { BLOCK_SURFACE_DEFINITIONS } from './block';
import { offsetPolygon3D } from './offsetPolygon3d';
import { SURFACE_SHAPES, type BasicSurfaceShape } from './surface';
import { getSurfaceOrientation } from './surfaceOrientation';
import type { BasicBlock } from './types';

const SURFACE_EDGE_WIDTH = 0.003;
const SURFACE_EDGE_COLOR = { r: 25, g: 25, b: 25 };

const SURFACE_INNER_RINGS = Object.fromEntries(
  Object.entries(SURFACE_SHAPES).map(([key, value]) => [
    key,
    offsetPolygon3D(value, SURFACE_EDGE_WIDTH),
  ]),
) as Record<BasicSurfaceShape, Vec3[]>;

export interface BuildSurfaceGeometryOptions {
  edge?: boolean;
  hollow?: boolean;
  color?: Color;
}

export function buildSurfaceGeometry(
  shape: BasicSurfaceShape,
  options?: DeepReadonly<BuildSurfaceGeometryOptions>,
) {
  const hollow = options?.hollow ?? false;
  const edge = hollow || (options?.edge ?? false);
  const color = options?.color;

  const outerRing = SURFACE_SHAPES[shape];
  const n = outerRing.length;

  const builder = new GeometryBuilder();
  if (n < 3) return builder;

  if (edge) {
    const innerRing = SURFACE_INNER_RINGS[shape];

    for (let i = 0; i < n; i++) {
      const v0 = outerRing[i]!;
      const v1 = outerRing[(i + 1) % n]!;
      const v2 = innerRing[(i + 1) % n]!;
      const v3 = innerRing[i]!;
      builder.addFace([v0, v1, v2, v3], { color: SURFACE_EDGE_COLOR });
    }

    if (!hollow) {
      builder.addFace(innerRing, { color });
    }
  } else {
    builder.addFace(outerRing, { color });
  }

  return builder;
}

export interface BuildBasicBlockGeometryOptions extends BuildSurfaceGeometryOptions {
  culling?: boolean; // default true
}

export function buildBasicBlockGeometry(
  blocks: DeepReadonly<BasicBlock[]>,
  options?: BuildBasicBlockGeometryOptions,
) {
  const builder = new GeometryBuilder();

  for (const block of blocks) {
    const blockBuilder = new GeometryBuilder();

    const surfaceDefinitions = BLOCK_SURFACE_DEFINITIONS[block.type];

    for (const surface of surfaceDefinitions) {
      const localPos = Object.assign({ x: 0, y: 0, z: 0 }, surface.position);
      const localRot = getSurfaceOrientation(surface.orientation, surface.rotation ?? 0).toMat3();

      const surfaceBuilder = buildSurfaceGeometry(surface.shape, options);
      surfaceBuilder.transform(localRot, stormToThreeVec3(localPos));
      blockBuilder.merge(surfaceBuilder);
    }

    blockBuilder.transform(
      stormToThreeMat3(block.transform ?? [1, 0, 0, 0, 1, 0, 0, 0, 1]),
      stormToThreeVec3(block.position),
    );
    builder.merge(blockBuilder);
  }

  return builder;
}

function stormToThreeMat3(m: Readonly<Mat3>): Mat3 {
  return [m[0], m[1], -m[2], m[3], m[4], -m[5], -m[6], -m[7], m[8]];
}

function stormToThreeVec3(v: Readonly<Vec3>): Vec3 {
  return {
    x: 0.25 * v.x,
    y: 0.25 * v.y,
    z: -0.25 * v.z,
  };
}
