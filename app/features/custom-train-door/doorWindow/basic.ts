import type { RenderHookArgs } from '~/features/polygon-editor';
import { drawWindows } from '../utils';

export interface WindowRingSet {
  innerRing: Vec2[];
  outerRing?: Vec2[];
}

export function getSingleWindowRect(
  baseRect: Readonly<Rect>,
  windowSize: Readonly<Vec2>,
  offset: Readonly<Vec2>,
): Rect {
  const x = baseRect.x + (baseRect.width - windowSize.x) / 2 + offset.x;
  const y = baseRect.y + baseRect.height - offset.y;
  return {
    x,
    y,
    width: windowSize.x,
    height: -windowSize.y,
  };
}

export interface GetSingleWindowPolygonOptions {
  windowSize: Vec2;
  offset: Vec2;
  radius?: number;
  segments?: number;
  frameThickness?: number;
  flip?: boolean;
  flipWidth?: number;
}

export function getSingleWindowPolygon(
  baseRect: Readonly<Rect>,
  options: DeepReadonly<GetSingleWindowPolygonOptions>,
): WindowRingSet {
  const frameThickness = options.frameThickness ?? 0;

  const rect = getSingleWindowRect(baseRect, options.windowSize, options.offset);
  const innerRing = createRoundedRectPolygon(rect, options.radius ?? 0, options.segments ?? 1);
  const outerRing = frameThickness > 0 ? offsetRing(innerRing, frameThickness / 0.25) : undefined;

  if (options.flip) {
    const w = options.flipWidth ?? 0;
    innerRing.forEach(({ x }, i, arr) => {
      arr[i]!.x = w - x;
    });
    if (outerRing) {
      outerRing.forEach(({ x }, i, arr) => {
        arr[i]!.x = w - x;
      });
    }
  }

  return { innerRing, outerRing };
}

export function drawWindowsOnCanvas(
  args: RenderHookArgs,
  windowRings: DeepReadonly<WindowRingSet[]>,
  frameColor: string,
) {
  const { ctx } = args;

  // 窓描画
  drawWindows(
    args,
    windowRings.map(({ innerRing }) => innerRing),
  );

  // 窓枠描画
  ctx.fillStyle = frameColor;
  for (const { innerRing, outerRing } of windowRings) {
    if (!outerRing) continue;
    ctx.beginPath();
    drawPolygonOnCanvas(ctx, innerRing, args.worldToCanvas);
    drawPolygonOnCanvas(ctx, outerRing, args.worldToCanvas);
    ctx.closePath();
    ctx.fill('evenodd');
  }
}

export interface BuildWindowGeomtryOptions {
  z1: number;
  z2: number;
  frameColor: string;
  coordinateConversion?: (position: Readonly<Vec2>) => Vec2;
}

export function buildWindowGeometry(
  builder: GeometryBuilder,
  windowRings: DeepReadonly<WindowRingSet>,
  options: DeepReadonly<BuildWindowGeomtryOptions>,
) {
  const posConversion = options?.coordinateConversion ?? ((p) => ({ x: p.x, y: p.y, z: 0 }));
  function ringConversion(ring: readonly Readonly<Vec2>[]) {
    return ring.map(posConversion);
  }

  const { z1, z2 } = options;

  const color = hexToRgb(options.frameColor);

  const innerRing = ringConversion(windowRings.innerRing);
  innerRing.reverse();

  if (windowRings.outerRing) {
    const outerRing = ringConversion(windowRings.outerRing);
    builder.addPolygon([outerRing, innerRing], { z: z1, color });
    builder.addPolygon([outerRing, innerRing], { z: z2, color, flip: true });
  }
  builder.addExtrudedSides(innerRing, { close: true, zRange: [z1, z2], color });
  builder.addPolygon([innerRing], { z: z1, materialIndex: 1 });
  builder.addPolygon([innerRing], { z: z1 - 0.02, materialIndex: 1, flip: true });
}
