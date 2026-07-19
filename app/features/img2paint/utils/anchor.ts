import type { AnchorPosition, AnchorState } from '../types';

export function getAnchorOffset(
  drawWidth: number,
  drawHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  anchor: AnchorPosition,
) {
  // AnchporPosition 名からオフセット値に変換
  let x = 0;

  switch (anchor) {
    case 'top-center':
    case 'center':
    case 'bottom-center':
      x = (canvasWidth - drawWidth) / 2;
      break;
    case 'top-right':
    case 'mid-right':
    case 'bottom-right':
      x = canvasWidth - drawWidth;
      break;
  }

  let y = 0;
  switch (anchor) {
    case 'mid-left':
    case 'center':
    case 'mid-right':
      y = (canvasHeight - drawHeight) / 2;
      break;
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      y = canvasHeight - drawHeight;
      break;
  }

  return { x, y };
}

export interface DrawData {
  widthBlocks: number;
  heightBlocks: number;
  canvasWidth: number;
  canvasHeight: number;
  offset: Vec2;
  isMultiplesOf9: boolean;
}

export function getDrawData(width: number, height: number, anchorState: Readonly<AnchorState>): DrawData {
  // キャンバスサイズ、オフセットを計算
  let widthBlocks = Math.ceil(width / 9);
  let heightBlocks = Math.ceil(height / 9);

  // オフセットを計算
  let { x: drawOffsetX, y: drawOffsetY } = getAnchorOffset(width, height, widthBlocks * 9, heightBlocks * 9, anchorState.anchorPosition);
  drawOffsetX += anchorState.offsetX;
  drawOffsetY += anchorState.offsetY;

  // オフセットによりはみ出したらキャンバスサイズを拡大
  const left = Math.floor(drawOffsetX);
  if (left < 0) {
    // 左方向にキャンバスを拡大
    const e = Math.ceil(-left / 9);
    drawOffsetX += e * 9;
    widthBlocks += e;
  }

  const right = Math.ceil(drawOffsetX + width);
  if (right > widthBlocks * 9) {
    // 右方向にキャンバスを拡大
    widthBlocks += Math.ceil((right - widthBlocks * 9) / 9);
  }

  const top = Math.floor(drawOffsetY);
  if (top < 0) {
    // 上方向にキャンバスを拡大
    const e = Math.ceil(-top / 9);
    drawOffsetY += e * 9;
    heightBlocks += e;
  }

  const bottom = Math.ceil(drawOffsetY + height);
  if (bottom > heightBlocks * 9) {
    // 下方向にキャンバスを拡大
    heightBlocks += Math.ceil((bottom - heightBlocks * 9) / 9);
  }

  return {
    widthBlocks, heightBlocks,
    canvasWidth: widthBlocks * 9,
    canvasHeight: heightBlocks * 9,
    offset: { x: drawOffsetX, y: drawOffsetY },
    isMultiplesOf9: width % 9 === 0 && height % 9 === 0,
  };
}
