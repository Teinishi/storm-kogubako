import type * as THREE from 'three';
import {
  createSurfacePaint,
  type FreePaintComponent,
  type PointerEventContext,
  type SurfaceRef,
} from '../surfacePaint';

export const PAINT_MODES = ['pixel', 'surface'] as const;
export type PaintMode = (typeof PAINT_MODES)[number];

export function usePaintTool() {
  const mode = ref<PaintMode>('pixel');
  const color = ref<string>('#FFFFFF');

  function dragPaint(
    components: FreePaintComponent[],
    hit: { surfaceRef: SurfaceRef; uv: THREE.Vector2 },
  ) {
    const { componentIndex, surfaceIndex } = hit.surfaceRef;

    const component = components[componentIndex];
    if (!component) return;

    component.surfacePaints ??= {};

    const rgbColor = hexToRgb(color.value);

    if (mode.value === 'pixel') {
      if (component.surfacePaints[surfaceIndex]?.kind !== 'paint') {
        const color = component.surfacePaints[surfaceIndex]?.color ?? { r: 255, g: 255, b: 255 };
        component.surfacePaints[surfaceIndex] = {
          kind: 'paint',
          paint: createSurfacePaint(9, 9, color),
        };
      }
      const paint = component.surfacePaints[surfaceIndex].paint;
      const u = Math.floor(hit.uv.x * paint.uSize);
      const v = Math.floor(hit.uv.y * paint.vSize);
      if (u < 0 || u >= paint.uSize || v < 0 || v >= paint.vSize) return;
      paint.colors[v]![u]! = { ...rgbColor };
      if (isSingleColor(paint.colors)) {
        component.surfacePaints[surfaceIndex] = {
          kind: 'singleColor',
          color: { ...rgbColor },
        };
      }
    } else if (mode.value === 'surface') {
      component.surfacePaints[surfaceIndex] = {
        kind: 'singleColor',
        color: { ...rgbColor },
      };
    }
  }

  function isSingleColor(colors: Color[][]): boolean {
    if (colors.length === 0) return true;
    const firstColor = colors[0]![0]!;
    for (const row of colors) {
      for (const color of row) {
        if (color.r !== firstColor.r || color.g !== firstColor.g || color.b !== firstColor.b) {
          return false;
        }
      }
    }
    return true;
  }

  function onPointerEvent(context: PointerEventContext) {
    if (context.kind === 'up') return;

    if ((context.event.buttons & 1) !== 0) {
      const hit = context.testRaycast();
      if (hit) {
        dragPaint(context.components.value, hit);
      }
    }
  }

  return { mode, color, onPointerEvent };
}
