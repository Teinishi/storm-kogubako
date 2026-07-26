import { BLOCK_SURFACE_DEFINITIONS, type SurfaceDefinition } from './block';
import { offsetPolygon3D } from './offsetPolygon3d';
import {
  compareCoverage,
  SURFACE_EDGE_COVERAGE,
  SURFACE_SHAPES,
  type BasicSurfaceShape,
} from './surface';
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
  // surface を連番IDで管理
  const surfaceMap: Map<
    number,
    { position: Vec3; matrix: Mat3; surface: SurfaceDefinition; isFlipped: boolean }
  > = new Map();

  // ブロックに対する surface のIDリスト
  const blockSurfaceIds: Map<number, number[]> = new Map();

  // カリング用に surface の位置と法線をキーとする Map
  const cullingMap: Map<string, Set<number>> | undefined =
    options?.culling === false ? undefined : new Map();

  const getCullingMapKey = (pos: Readonly<Vec3>, normal: Readonly<Vec3>) =>
    `${pos.x},${pos.y},${pos.z}:${normal.x},${normal.y},${normal.z}`;

  // カリングによって消える surface のID
  const removeSurfaces: Set<number> = new Set();

  let idCounter = 0;
  blocks.forEach((block, blockIndex) => {
    const blockPos = block.position;
    const blockTransform = block.transform;

    const surfaceIds = [];

    const surfaces = BLOCK_SURFACE_DEFINITIONS[block.type];
    for (const surface of surfaces) {
      const localPos = Object.assign({ x: 0, y: 0, z: 0 }, surface.position);
      const position = addVec3(
        blockTransform ? mulMat3Vec3(blockTransform, localPos) : localPos,
        blockPos,
      );

      let matrix = getSurfaceOrientation(surface.orientation, surface.rotation ?? 0).toMat3();
      if (blockTransform) matrix = mulMat3(blockTransform, matrix);

      const normal = getMatrixAxis(matrix, 'x');

      const id = idCounter++;
      surfaceMap.set(id, { position, matrix, surface, isFlipped: detMat3(matrix) < 0 });
      surfaceIds.push(id);

      if (cullingMap && surface.shape in SURFACE_EDGE_COVERAGE) {
        const key = getCullingMapKey(position, normal);
        cullingMap.getOrInsertComputed(key, () => new Set()).add(id);
      }
    }

    blockSurfaceIds.set(blockIndex, surfaceIds);
  });

  if (cullingMap) {
    // surface をカリング
    for (const [id1, data1] of surfaceMap) {
      if (removeSurfaces.has(id1)) continue;

      const coverage1 = SURFACE_EDGE_COVERAGE[data1.surface.shape];
      if (!coverage1) continue;

      const normal = getMatrixAxis(data1.matrix, 'x');

      const adjacentPosition = addVec3(data1.position, normal);
      const adjacentKey = getCullingMapKey(adjacentPosition, mulVec3(normal, -1));
      const adjacentIds = cullingMap.get(adjacentKey);
      if (!adjacentIds) continue;

      const up = getMatrixAxis(data1.matrix, 'y');
      const right = getMatrixAxis(data1.matrix, 'z');
      const bottomLeft = subVec3(mulVec3(up, -1), right);

      for (const id2 of adjacentIds) {
        if (id2 < id1) continue;

        const data2 = surfaceMap.get(id2)!;
        const coverage2 = SURFACE_EDGE_COVERAGE[data2.surface.shape];
        if (!coverage2) continue;

        const up2 = getMatrixAxis(data2.matrix, 'y');
        const right2 = getMatrixAxis(data2.matrix, 'z');
        const flip = data1.isFlipped === data2.isFlipped;

        let start;
        if (eqVec3(subVec3(mulVec3(up2, -1), right2), bottomLeft)) {
          start = 0;
        } else if (eqVec3(addVec3(mulVec3(up2, -1), right2), bottomLeft)) {
          start = 1;
        } else if (eqVec3(addVec3(up2, right2), bottomLeft)) {
          start = 2;
        } else if (eqVec3(subVec3(up2, right2), bottomLeft)) {
          start = 3;
        } else {
          continue;
        }

        const { isACovered, isBCovered } = compareCoverage(coverage1, coverage2, start, flip);
        if (isACovered) removeSurfaces.add(id1);
        if (isBCovered) removeSurfaces.add(id2);
      }
    }
  }

  const builder = new GeometryBuilder();

  for (const [id, data] of surfaceMap) {
    if (removeSurfaces.has(id)) continue;

    const s = buildSurfaceGeometry(data.surface.shape, options);
    s.transform(stormToThreeMat3(data.matrix), stormToThreeVec3(data.position));
    builder.merge(s);
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

function getMatrixAxis(m: Readonly<Mat3>, axis: 'x' | 'y' | 'z'): Vec3 {
  const i = 'xyz'.indexOf(axis);
  return { x: m[i]!, y: m[i + 3]!, z: m[i + 6]! };
}
