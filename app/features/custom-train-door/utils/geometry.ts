import { transformPolygons, type PolygonEditorPolygon, type PolygonEditorValue } from '~/features/polygon-editor';
import { buildWindowGeometry, type WindowRingSet } from '../doorWindow/basic';
import { createCoordinateConverter } from './coordinateConversion';

export interface BuildPolygonGeometryOptions {
  basePolygon?: Vec2[][];
  baseColor?: Color;
  holeRings?: Vec2[][];
  z?: number;
  coordinateConversion?: (position: Readonly<Vec2>) => Vec2;
  flip?: boolean;
}

export function buildPolygonGeometry(
  builder: GeometryBuilder,
  polygons: readonly Readonly<PolygonEditorPolygon>[],
  options?: Readonly<BuildPolygonGeometryOptions>,
) {
  const posConversion = options?.coordinateConversion ?? (p => ({ x: p.x, y: p.y, z: 0 }));
  function ringConversion(ring: readonly Readonly<Vec2>[]) {
    return ring.map(posConversion);
  }

  const z = options?.z ?? 0;
  const flip = options?.flip ?? false;

  const disjoint = eliminatePolygonOverlap(
    polygons.map(({ id, vertices }) => ({ id, polygon: [vertices] })),
    {
      base: options?.basePolygon && { id: -1, polygon: options.basePolygon },
      holes: options?.holeRings,
    },
  );

  for (const { id, polygon } of disjoint) {
    const hexColor = polygons.find(v => v.id === id)?.color;
    const color = (hexColor !== undefined ? hexToRgb(hexColor) : options?.baseColor) ?? WHITE;
    const transformed = polygon.map(ringConversion);
    builder.addPolygon(transformed, { z, color, flip });
  }
}

export function buildRubberGeometry(
  builder: GeometryBuilder,
  root: Vec3,
  tip: Vec3,
  options: AddFaceOptions,
) {
  const { x: x1, y: y1, z: z1 } = tip;
  const { x: x2, y: y2, z: z2 } = root;
  const z1i = lerp(z1, z2, 0.2);
  const z2i = lerp(z2, z1, 0.2);

  const v0 = { x: x1, y: y1, z: z1i };
  const v1 = { x: x2, y: y1, z: z1 };
  const v2 = { x: x2, y: y2, z: z1 };
  const v3 = { x: x1, y: y2, z: z1i };
  const v4 = { x: x1, y: y1, z: z2i };
  const v5 = { x: x2, y: y1, z: z2 };
  const v6 = { x: x2, y: y2, z: z2 };
  const v7 = { x: x1, y: y2, z: z2i };

  builder.addFace([v0, v1, v2, v3], options);
  builder.addFace([v3, v2, v6, v7], options);
  builder.addFace([v7, v6, v5, v4], options);
  builder.addFace([v4, v5, v1, v0], options);
  builder.addFace([v0, v3, v7, v4], options);
}

export interface BuildSlidingDoorGeometryOptions {
  baseRect: Readonly<Rect>;
  outsidePaint: Readonly<PolygonEditorValue>;
  insidePaint: Readonly<PolygonEditorValue>;
  doorSize: Vec2;
  frontZ: number;
  backZ: number;
  frontColor: Color;
  backColor: Color;
  direction: 'right' | 'left';
  rubberThickness: number;
  rubberColor: Color;
  windowRings: readonly Readonly<WindowRingSet>[];
}

export function buildSlidingDoorGeometry(
  builder: GeometryBuilder,
  options: Readonly<BuildSlidingDoorGeometryOptions>,
) {
  const {
    baseRect,
    outsidePaint,
    insidePaint,
    doorSize,
    frontZ,
    backZ,
    frontColor,
    backColor,
    direction,
    rubberThickness,
    rubberColor,
    windowRings,
  } = options;

  const coordinateConversion = createCoordinateConverter(options.doorSize);
  const flipX = ({ x, y }: Vec2) => ({ x: options.doorSize.x - x, y });

  const basePolygon = [rectToRing(baseRect)];
  const holeRings = windowRings.map(v => v.outerRing);

  // ドア外面
  buildPolygonGeometry(
    builder,
    outsidePaint.polygons,
    {
      basePolygon,
      baseColor: frontColor,
      holeRings,
      z: frontZ,
      coordinateConversion,
    },
  );

  // ドア内面
  buildPolygonGeometry(
    builder,
    transformPolygons(insidePaint.polygons, flipX),
    {
      basePolygon,
      baseColor: backColor,
      holeRings,
      z: backZ,
      coordinateConversion,
      flip: true,
    },
  );

  // ドア側面
  const path = [
    { x: baseRect.x, y: baseRect.y },
    { x: baseRect.x + baseRect.width, y: baseRect.y },
    { x: baseRect.x + baseRect.width, y: baseRect.y + baseRect.height },
    { x: baseRect.x, y: baseRect.y + baseRect.height },
  ];
  if (direction === 'left') {
    path.push(...path.splice(0, 2));
  }
  builder.addExtrudedSides(
    path.map(coordinateConversion),
    {
      zRange: [frontZ, backZ],
      color: frontColor,
    },
  );

  // 戸先ゴム
  const rubberRootX = direction === 'right' ? baseRect.x : baseRect.x + baseRect.width;
  const rubberTipX = direction === 'right' ? rubberRootX - rubberThickness : rubberRootX + rubberThickness;
  buildRubberGeometry(
    builder,
    {
      ...coordinateConversion({ x: rubberRootX, y: 0 }),
      z: frontZ,
    },
    {
      ...coordinateConversion({ x: rubberTipX, y: doorSize.y }),
      z: backZ,
    },
    {
      color: rubberColor,
      flip: direction === 'left',
    },
  );

  // 窓
  for (const ringSet of windowRings) {
    buildWindowGeometry(builder, ringSet, {
      z1: frontZ,
      z2: backZ,
      coordinateConversion,
    });
  }
}
