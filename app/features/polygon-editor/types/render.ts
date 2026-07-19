import type { PolygonEditor } from '../composables';

export interface CanvasMetrics {
  width: number;
  height: number;
  dpr: number;
  originX: number;
  originY: number;
}

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  logicalWidth: number;
  logicalHeight: number;
}

export interface RenderHookArgs {
  editor: PolygonEditor;
  ctx: CanvasRenderingContext2D;
  metrics: CanvasMetrics;
  transform: ViewTransform;
  worldToCanvas(point: Vec2): Vec2;
  worldRectToCanvas(rect: Rect): Rect;
}

export interface RenderHooks {
  onBeforeRenderPolygons?(args: RenderHookArgs): void;
  onBeforeRenderSelection?(args: RenderHookArgs): void;
  onAfterRender?(args: RenderHookArgs): void;
}
