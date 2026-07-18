import type { RenderHookArgs } from '~/features/polygon-editor/types/render';
import type { TrainDoorState } from '../types/TrainDoorState';
import { drawWindows } from '../utils/renderHook.client';

const FRAME_WIDTH = 0.02;
const FRAME_COLOR = '#545454';

export interface WindowRingSet {
  innerRing: Vec2[];
  outerRing: Vec2[];
}

export function getSingleWindowRect(baseRect: Readonly<Rect>, state: Readonly<TrainDoorState>): Rect {
  const windowWidth = state.windowWidth / 0.25;
  const windowHeight = state.windowHeight / 0.25;

  const x = baseRect.x + (baseRect.width - windowWidth) / 2 + state.windowXOffset;
  const y = baseRect.y + baseRect.height - state.windowYOffset / 0.25;

  return {
    x,
    y,
    width: windowWidth,
    height: -windowHeight,
  };
}

export function getSingleWindowPolygon(baseRect: Readonly<Rect>, state: Readonly<TrainDoorState>, flip?: boolean) {
  const radius = state.windowCornerRadius / 0.25;
  const segments = state.windowCornerDivisions;

  const innerRing = createRoundedRectPolygon(getSingleWindowRect(baseRect, state), radius, segments);
  const outerRing = offsetPolygon(innerRing, FRAME_WIDTH / 0.25);

  if (flip) {
    innerRing.forEach(({ x }, i, arr) => {
      arr[i]!.x = state.doorWidth - x;
    });
    outerRing.forEach(({ x }, i, arr) => {
      arr[i]!.x = state.doorWidth - x;
    });
  }

  return { innerRing, outerRing };
}

export function drawWindowsOnCanvas(
  args: RenderHookArgs,
  windowRings: readonly Readonly<WindowRingSet>[],
) {
  const { ctx } = args;

  // 窓描画
  drawWindows(args, windowRings.map(({ innerRing }) => innerRing));

  // 窓枠描画
  ctx.fillStyle = '#545454';
  for (const { innerRing, outerRing } of windowRings) {
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
  coordinateConversion?: (position: Readonly<Vec2>) => Vec2;
}

export function buildWindowGeometry(
  builder: GeometryBuilder,
  windowRings: Readonly<WindowRingSet>,
  options: Readonly<BuildWindowGeomtryOptions>,
) {
  const posConversion = options?.coordinateConversion ?? (p => ({ x: p.x, y: p.y, z: 0 }));
  function ringConversion(ring: readonly Readonly<Vec2>[]) {
    return ring.map(posConversion);
  }

  const { z1, z2 } = options;

  const color = hexToRgb(FRAME_COLOR);

  const innerRing = ringConversion(windowRings.innerRing);
  const outerRing = ringConversion(windowRings.outerRing);
  innerRing.reverse();

  builder.addPolygon([outerRing, innerRing], { z: z1, color });
  builder.addPolygon([outerRing, innerRing], { z: z2, color, flip: true });
  builder.addExtrudedSides(innerRing, { close: true, zRange: [z1, z2], color });
  builder.addPolygon([innerRing], { z: z1, materialIndex: 1 });
  builder.addPolygon([innerRing], { z: z1 - 0.02, materialIndex: 1, flip: true });
}
