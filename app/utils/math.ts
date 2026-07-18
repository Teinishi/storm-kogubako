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

export function cloneVec2(value: Readonly<Vec2>): Vec2 {
  return {
    x: value.x,
    y: value.y,
  };
}

export const round = (x: number, n: number) => Math.round(x * 10 ** n) / 10 ** n;

export function lerp(a: number, b: number, t: number) {
  return (1 - t) * a + t * b;
}

export function clamp(x: number, a: number, b: number) {
  return Math.min(Math.max(x, a), b);
}
