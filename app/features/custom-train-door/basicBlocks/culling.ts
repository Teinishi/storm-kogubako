import { SURFACE_EDGE_COVERAGE, type ShapeEdgeCoverage } from './surface';
import type { BasicSurface, BasicSurfaceOrientation, BasicSurfaceRotation } from './types';

function flipEdgeCoverage(coverage: DeepReadonly<ShapeEdgeCoverage>, isZ: boolean) {
  return [
    coverage[isZ ? 0 : 2].toReversed(),
    coverage[isZ ? 3 : 1].toReversed(),
    coverage[isZ ? 2 : 0].toReversed(),
    coverage[isZ ? 1 : 3].toReversed(),
  ] as ShapeEdgeCoverage;
}

function rotateEdgeCoverage(
  coverage: DeepReadonly<ShapeEdgeCoverage>,
  rotation: number,
): DeepReadonly<ShapeEdgeCoverage> {
  return [
    coverage[((rotation % 4) + 4) % 4]!,
    coverage[((rotation % 4) + 5) % 4]!,
    coverage[((rotation % 4) + 6) % 4]!,
    coverage[((rotation % 4) + 7) % 4]!,
  ];
}

function coverageToInt(coverage: DeepReadonly<ShapeEdgeCoverage>) {
  let v = 0;
  for (let i = 0; i < 16; i++) {
    v |= (coverage[Math.floor(i / 4)]![i % 4]! ? 1 : 0) << i;
  }
  return v;
}

function checkCulling(
  orientation: BasicSurfaceOrientation,
  rotationA: BasicSurfaceRotation,
  shapeA: number,
  rotationB: BasicSurfaceRotation,
  shapeB: number,
) {
  const coverageA = SURFACE_EDGE_COVERAGE[shapeA];
  const coverageB = SURFACE_EDGE_COVERAGE[shapeB];

  if (!coverageA || !coverageB) return { cullA: false, cullB: false };

  const isZ = orientation === 4 || orientation === 5;
  const a = coverageToInt(rotateEdgeCoverage(coverageA, rotationA));
  const b = coverageToInt(rotateEdgeCoverage(flipEdgeCoverage(coverageB, isZ), -rotationB));

  return {
    cullA: (a & ~b) === 0,
    cullB: (b & ~a) === 0,
  };
}

export function cullSurfaces(surfaces: DeepReadonly<BasicSurface[]>): DeepReadonly<BasicSurface>[] {
  const removeIndices = new Set();

  const surfaceMap: Map<number, DeepReadonly<BasicSurface>> = new Map();
  const positionOrientationMap: Map<string, Set<number>> = new Map();
  surfaces.forEach((s, index) => {
    if (s.shape in SURFACE_EDGE_COVERAGE) {
      surfaceMap.set(index, s);
      const key = `${s.position.x},${s.position.y},${s.position.z}:${s.orientation}`;
      positionOrientationMap.getOrInsertComputed(key, () => new Set()).add(index);
    }
  });

  for (const [aId, a] of surfaceMap) {
    if (removeIndices.has(aId)) continue;

    const { orientation } = a;
    const { x, y, z } = a.position;

    let adjacentKey;
    switch (orientation) {
      case 0:
        adjacentKey = `${x + 1},${y},${z}:1`;
        break;
      case 1:
        adjacentKey = `${x - 1},${y},${z}:0`;
        break;
      case 2:
        adjacentKey = `${x},${y + 1},${z}:3`;
        break;
      case 3:
        adjacentKey = `${x},${y - 1},${z}:2`;
        break;
      case 4:
        adjacentKey = `${x},${y},${z + 1}:5`;
        break;
      case 5:
        adjacentKey = `${x},${y},${z - 1}:4`;
        break;
      default:
        orientation satisfies never;
        throw new Error('Unreachable');
    }

    const adjacentIds = positionOrientationMap.get(adjacentKey);
    if (!adjacentIds) continue;

    for (const bId of adjacentIds) {
      const b = surfaceMap.get(bId)!;

      const { cullA, cullB } = checkCulling(orientation, a.rotation, a.shape, b.rotation, b.shape);

      if (cullA) {
        removeIndices.add(aId);
        break;
      }
      if (cullB) {
        removeIndices.add(bId);
      }
    }
  }

  return surfaces.filter((_, i) => !removeIndices.has(i));
}
