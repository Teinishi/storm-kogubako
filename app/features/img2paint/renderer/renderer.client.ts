import type { Img2PaintState, ResizeState } from '../types';
import type { DrawData } from '../utils';

function drawResizedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  resizeState: ResizeState,
  offset: Vec2,
) {
  let { x: offsetX, y: offsetY } = offset;
  let drawWidth = resizeState.widthPixels;
  let drawHeight = resizeState.heightPixels;
  if (resizeState.resizeAlgo === 'smooth') {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  else {
    ctx.imageSmoothingEnabled = false;
    offsetX = Math.round(offsetX);
    offsetY = Math.round(offsetY);
    drawWidth = Math.round(drawWidth);
    drawHeight = Math.round(drawHeight);
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

export function paintCanvas(
  state: Img2PaintState,
  baseDrawData: DrawData,
  glowOffset: Vec2,
  showGlow: boolean,
  baseCanvas: HTMLCanvasElement,
  glowCanvas?: HTMLCanvasElement,
  isPreview?: boolean,
) {
  // 描画
  const { canvasWidth, canvasHeight } = baseDrawData;

  if (!state.baseImage) return;
  baseCanvas.width = canvasWidth;
  baseCanvas.height = canvasHeight;
  const bCtx = baseCanvas.getContext('2d')!;

  bCtx.fillStyle = state.bgColor;
  bCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawResizedImage(bCtx, state.baseImage, state.baseResize, baseDrawData.offset);

  // 発光キャンバスをリセット
  if (!glowCanvas) return;
  glowCanvas.width = canvasWidth;
  glowCanvas.height = canvasHeight;
  const gCtx = glowCanvas.getContext('2d')!;

  if (isPreview) {
    gCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  else {
    gCtx.fillStyle = '#000';
    gCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 発光描画
  if (!showGlow) return;
  if (isPreview) {
    if (state.glowImageDisplay) {
      bCtx.globalCompositeOperation = 'lighter';
      drawResizedImage(bCtx, state.glowImageDisplay, state.glowResize, glowOffset);
      drawResizedImage(gCtx, state.glowImageDisplay, state.glowResize, glowOffset);
    }
  }
  else if (state.glowImage) {
    drawResizedImage(gCtx, state.glowImage, state.glowResize, glowOffset);
  }
}
