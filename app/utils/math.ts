export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundingBox {
  min: Vec2;
  max: Vec2;
}

export type Mat3 = [number, number, number, number, number, number, number, number, number];

export const round = (x: number, n: number) => Math.round(x * 10 ** n) / 10 ** n;

export function lerp(a: number, b: number, t: number) {
  return (1 - t) * a + t * b;
}

export function clamp(x: number, a: number, b: number) {
  return Math.min(Math.max(x, a), b);
}

export function cloneVec2(value: Readonly<Vec2>): Vec2 {
  return {
    x: value.x,
    y: value.y,
  };
}

export function minVec2(a: Readonly<Vec2>, b: Readonly<Vec2>): Vec2 {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
  };
}

export function maxVec2(a: Readonly<Vec2>, b: Readonly<Vec2>): Vec2 {
  return {
    x: Math.max(a.x, b.x),
    y: Math.max(a.y, b.y),
  };
}

export function minVec3(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    z: Math.min(a.z, b.z),
  };
}

export function maxVec3(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
  return {
    x: Math.max(a.x, b.x),
    y: Math.max(a.y, b.y),
    z: Math.max(a.z, b.z),
  };
}

export function addVec3(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

export function subVec3(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

export function mulVec3(a: Readonly<Vec3>, s: number): Vec3 {
  return {
    x: a.x * s,
    y: a.y * s,
    z: a.z * s,
  };
}

export function dotVec3(a: Readonly<Vec3>, b: Readonly<Vec3>) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function crossVec3(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  return mulVec3(v, 1 / len);
}

export function getBoundingBox(vertices: DeepReadonly<Vec2[]>): BoundingBox | undefined {
  let boundsMin, boundsMax;
  for (const v of vertices) {
    if (!boundsMin) {
      boundsMin = { x: v.x, y: v.y };
    } else {
      boundsMin = minVec2(boundsMin, v);
    }

    if (!boundsMax) {
      boundsMax = { x: v.x, y: v.y };
    } else {
      boundsMax = maxVec2(boundsMax, v);
    }
  }

  if (!boundsMin || !boundsMax) return;

  return { min: boundsMin, max: boundsMax };
}

export function mergeBoundingBox(a: Readonly<BoundingBox>, b: Readonly<BoundingBox>): BoundingBox {
  return {
    min: minVec2(a.min, b.min),
    max: maxVec2(a.max, b.max),
  };
}

export function normalizeRect(rect: Readonly<Rect>): Rect {
  let { x, y, width, height } = rect;
  if (width < 0) {
    width *= -1;
    x -= width;
  }
  if (height < 0) {
    height *= -1;
    y -= height;
  }
  return { x, y, width, height };
}

export function forVoxels(
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  callback: (position: Vec3) => void,
) {
  const { x: x1, y: y1, z: z1 } = minVec3(from, to);
  const { x: x2, y: y2, z: z2 } = maxVec3(from, to);

  for (let z = z1; z <= z2; z++) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        callback({ x, y, z });
      }
    }
  }
}
