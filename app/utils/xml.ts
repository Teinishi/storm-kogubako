import type { XmlVec3 } from '@sw-file-lib/xml';

export function createXmlVec3({ x, y, z }: Readonly<Vec3>): XmlVec3 | undefined {
  if (x === 0 && y === 0 && z === 0) {
    return;
  }
  const v: XmlVec3 = {};
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
