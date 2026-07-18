import type { CanvasMetrics, ViewTransform } from '../types/render';
import type { LogicalBounds } from './bounds';

export const VIEW_PADDING = 16;

export function getViewTransform(metrics: Readonly<CanvasMetrics>, bounds: Readonly<LogicalBounds>): ViewTransform {
  const logicalWidth = Math.max(0.000001, bounds.maxX - bounds.minX);
  const logicalHeight = Math.max(0.000001, bounds.maxY - bounds.minY);
  const innerWidth = metrics.width - 2 * VIEW_PADDING;
  const innerHeight = metrics.height - 2 * VIEW_PADDING;
  const scale = Math.min(innerWidth / logicalWidth, innerHeight / logicalHeight);
  const offsetX = (innerWidth - logicalWidth * scale) / 2 - bounds.minX * scale + VIEW_PADDING;
  const offsetY = innerHeight - (innerHeight - logicalHeight * scale) / 2 + bounds.minY * scale + VIEW_PADDING;
  return {
    scale,
    offsetX,
    offsetY,
    logicalWidth,
    logicalHeight,
  };
}

export function worldToCanvas(point: Readonly<Vec2>, transform: Readonly<ViewTransform>) {
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY - point.y * transform.scale,
  };
}
