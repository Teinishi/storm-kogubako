export function compactVec3({ x, y, z }: Readonly<Vec3>): Partial<Vec3> | undefined {
  if (x === 0 && y === 0 && z === 0) {
    return;
  }
  const v: Partial<Vec3> = {};
  if (x !== 0) {
    v.x = x;
  }
  if (y !== 0) {
    v.y = y;
  }
  if (z !== 0) {
    v.z = z;
  }
  return v;
}
