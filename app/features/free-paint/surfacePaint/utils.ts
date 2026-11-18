import type { FreePaintComponent, SurfacePaintGrid } from './types';

export function createCheckerPattern(uSize: number, vSize: number): Color[][] {
  const colors: Color[][] = [];
  for (let v = 0; v < vSize; v++) {
    const row: Color[] = [];
    for (let u = 0; u < uSize; u++) {
      const isBlack = (u + v) % 2 === 0;
      row.push(isBlack ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 });
    }
    colors.push(row);
  }
  return colors;
}

export function createSurfacePaint(
  uSize: number,
  vSize: number,
  color: Readonly<Color>,
): SurfacePaintGrid {
  return {
    uSize,
    vSize,
    colors: Array.from({ length: vSize }, () =>
      Array.from({ length: uSize }, () => ({ ...color })),
    ),
  };
}

export function getVoxelComponentMap(
  components: DeepReadonly<FreePaintComponent[]>,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const [index, component] of components.entries()) {
    // todo: 複数ボクセルを占有するコンポーネント対応
    const key = `${component.pos.x},${component.pos.y},${component.pos.z}`;
    map.set(key, index);
  }

  return map;
}
