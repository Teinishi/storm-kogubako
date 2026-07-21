export function getVoxelRange(doorWidth: number, doorHeight: number) {
  const z2 = Math.floor(doorWidth / 2);
  const z1 = z2 - doorWidth + 1;
  const y1 = -Math.floor(doorHeight / 2);
  const y2 = y1 + doorHeight - 1;

  return {
    min: { x: 0, y: y1, z: z1 },
    max: { x: 0, y: y2, z: z2 },
  };
}

export function getVoxelVolume(from: Readonly<Vec3>, to: Readonly<Vec3>) {
  const x = Math.abs(to.x - from.x) + 1;
  const y = Math.abs(to.y - from.y) + 1;
  const z = Math.abs(to.z - from.z) + 1;
  return x * y * z;
}
