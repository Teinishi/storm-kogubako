import { getSurfaces } from './block';
import { offsetPolygon3D } from './offsetPolygon3d';
import { SURFACE_SHAPES, type BasicSurfaceShape } from './surface';
import type { BasicBlock, BasicSurface, SurfaceGeometryOptions } from './types';

const SURFACE_EDGE_WIDTH = 0.003;
const SURFACE_EDGE_COLOR = { r: 25, g: 25, b: 25 };

const SURFACE_INNER_RINGS = Object.fromEntries(
  Object.entries(SURFACE_SHAPES).map(([key, value]) => [
    key,
    offsetPolygon3D(value, SURFACE_EDGE_WIDTH),
  ]),
) as Record<BasicSurfaceShape, Vec3[]>;

export function buildSurfaceGeometry(
  surface: BasicSurface,
  options?: DeepReadonly<SurfaceGeometryOptions>,
) {
  const edge = options?.edge ?? false;
  const color = options?.color;

  const builder = new GeometryBuilder();

  const outerRing = SURFACE_SHAPES[surface.shape];
  const n = outerRing.length;

  if (n < 3) return builder;

  if (edge) {
    const innerRing = SURFACE_INNER_RINGS[surface.shape];

    for (let i = 0; i < n; i++) {
      const v0 = outerRing[i]!;
      const v1 = outerRing[(i + 1) % n]!;
      const v2 = innerRing[(i + 1) % n]!;
      const v3 = innerRing[i]!;
      builder.addFace([v0, v1, v2, v3], { color: SURFACE_EDGE_COLOR });
    }

    builder.addFace(innerRing, { color });
  } else {
    builder.addFace(outerRing, { color });
  }

  let transform = Orientation.Identity;
  switch (surface.rotation) {
    case 1:
      transform = Orientation.RotateX270;
      break;
    case 2:
      transform = Orientation.RotateX180;
      break;
    case 3:
      transform = Orientation.RotateX90;
      break;
  }

  switch (surface.orientation) {
    case 1:
      transform = transform.multiply(Orientation.RotateZ180);
      break;
    case 2:
      transform = transform.multiply(Orientation.RotateZ90);
      break;
    case 3:
      transform = transform.multiply(Orientation.RotateZ270);
      break;
    case 4:
      transform = transform.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX270);
      break;
    case 5:
      transform = transform.multiply(Orientation.RotateZ90).multiply(Orientation.RotateX90);
      break;
  }

  builder.transform(transform, {
    x: 0.25 * surface.position.x,
    y: 0.25 * surface.position.y,
    z: -0.25 * surface.position.z,
  });

  return builder;
}

export function buildBasicBlockGeometry(
  blocks: DeepReadonly<BasicBlock[]>,
  options?: SurfaceGeometryOptions,
) {
  const builder = new GeometryBuilder();

  for (const block of blocks) {
    const surfaces = getSurfaces(block);

    for (const surface of surfaces) {
      // todo: カリング

      builder.merge(buildSurfaceGeometry(surface, options));
    }
  }

  return builder;
}
