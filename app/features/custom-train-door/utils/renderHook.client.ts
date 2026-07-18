import type { RenderHookArgs } from '~/features/polygon-editor/types/render';
import type { TrainDoorState } from '../types/TrainDoorState';

export function drawBackground(
  { ctx, worldRectToCanvas }: RenderHookArgs,
  state: Readonly<TrainDoorState>,
  isInside: boolean,
) {
  const r = worldRectToCanvas({ x: 0, y: 0, width: state.doorWidth, height: state.doorHeight });
  ctx.globalAlpha = 1;
  ctx.fillStyle = isInside ? state.insideColor : state.outsideColor;
  ctx.fillRect(r.x, r.y, r.width, r.height);
}

export function drawWindows(
  { ctx, worldToCanvas }: RenderHookArgs,
  windowPolygons: readonly (readonly Readonly<Vec2>[])[],
) {
  const bb = windowPolygons.reduce((prev: BoundingBox | undefined, curr) => {
    const bb = getBoundingBox(curr);
    if (prev && bb) return mergeBoundingBox(prev, bb);
    else if (prev) return prev;
    else return bb;
  }, undefined);

  if (!bb) return;

  const { y: bottom } = worldToCanvas(bb.min);
  const { y: top } = worldToCanvas(bb.max);

  const grad = ctx.createLinearGradient(0, top, 0, bottom);
  grad.addColorStop(0, 'hsl(220 75% 52%)');
  grad.addColorStop(1, 'hsl(177 33% 76%)');
  ctx.fillStyle = grad;

  for (const ring of windowPolygons) {
    ctx.beginPath();
    drawPolygonOnCanvas(ctx, ring, worldToCanvas);
    ctx.closePath();
    ctx.fill();
  }
}
