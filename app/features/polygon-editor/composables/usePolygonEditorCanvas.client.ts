import type { Ref } from 'vue';
import type { PolygonEditor } from './usePolygonEditor';
import type { CanvasMetrics, RenderHooks, ViewTransform } from '../types/render';
import { worldToCanvas as worldToCanvasWithBounds, getViewTransform } from '../utils/coordinateConversion';
import {
  findHitEdge as findHitEdgeInPolygons,
  findHitPolygon as findHitPolygonInPolygons,
  findHitVertex as findHitVertexInPolygons,
  GRID_SCALE,
  HANDLE_HIT_THRESHOLD_PX,
  type HitEdge,
  type HitVertex,
} from '../utils/pointer';
import type { ReadonlyPolygon } from '../types/modelValue';

export type UsePolygonCanvasOptions = {
  canvasRef: Ref<HTMLCanvasElement | null>;
  editor: PolygonEditor;
};

export function usePolygonEditorCanvas(options: UsePolygonCanvasOptions) {
  const {
    canvasRef,
    editor,
  } = options;
  const {
    grid,
    logicalBounds,
    editorState,
    selectedPolygonId,
    selectedVertexIndex,
    draftPolygon,
    draftRectangle,
    snapPoint,
    createRectanglePolygon,
  } = editor;

  function getCanvasMetrics() {
    const canvas = canvasRef.value;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      width: rect.width,
      height: rect.height,
      dpr: window.devicePixelRatio || 1,
      originX: 0,
      originY: 0,
    } satisfies CanvasMetrics;
  }

  function worldToCanvas(point: Vec2, transform: ViewTransform) {
    return worldToCanvasWithBounds(point, transform);
  }

  function canvasToWorldRaw(clientX: number, clientY: number) {
    const canvas = canvasRef.value;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const metrics = getCanvasMetrics();
    if (!metrics) {
      return { x: 0, y: 0 };
    }

    const transform = getViewTransform(metrics, logicalBounds.value);
    const x = (clientX - rect.left - transform.offsetX) / transform.scale;
    const y = (transform.offsetY - (clientY - rect.top)) / transform.scale;
    return { x, y };
  }

  function canvasToWorld(clientX: number, clientY: number) {
    return snapPoint(canvasToWorldRaw(clientX, clientY));
  }

  function findHitVertex(point: Vec2) {
    return findHitVertexInPolygons(
      point,
      editorState.value.polygons,
      HANDLE_HIT_THRESHOLD_PX / GRID_SCALE,
    ) as HitVertex | null;
  }

  function findHitEdge(point: Vec2) {
    return findHitEdgeInPolygons(
      point,
      editorState.value.polygons,
      HANDLE_HIT_THRESHOLD_PX / GRID_SCALE,
      snapPoint,
    ) as HitEdge | null;
  }

  function findHitPolygon(point: Vec2) {
    return findHitPolygonInPolygons(point, editorState.value.polygons);
  }

  function renderGrid(ctx: CanvasRenderingContext2D, transform: ViewTransform) {
    // TODO: metrics が本当に必要かどうか調査
    if (!grid.value.enabled) return;

    const minorDivisions = Math.max(1, grid.value.minorDivisions);
    const minX = logicalBounds.value.minX;
    const maxX = logicalBounds.value.maxX;
    const minY = logicalBounds.value.minY;
    const maxY = logicalBounds.value.maxY;
    const majorStroke = 'rgba(30, 187, 247, 0.7)';
    const minorStroke = 'rgba(30, 187, 247, 0.3)';
    const topLeft = worldToCanvas({ x: minX, y: maxY }, transform);
    const bottomRight = worldToCanvas({ x: maxX, y: minY }, transform);

    ctx.save();
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.clip();
    ctx.lineWidth = 1;

    const drawVerticalLine = (worldX: number, strokeStyle: string, width: number) => {
      const x = transform.offsetX + worldX * transform.scale;
      ctx.beginPath();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = width;
      ctx.moveTo(x, topLeft.y);
      ctx.lineTo(x, bottomRight.y);
      ctx.stroke();
    };

    const drawHorizontalLine = (worldY: number, strokeStyle: string, width: number) => {
      const y = transform.offsetY - worldY * transform.scale;
      ctx.beginPath();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = width;
      ctx.moveTo(topLeft.x, y);
      ctx.lineTo(bottomRight.x, y);
      ctx.stroke();
    };

    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x += 1) {
      drawVerticalLine(x, majorStroke, 1.25);

      if (minorDivisions > 1) {
        for (let division = 1; division < minorDivisions; division += 1) {
          const minorX = x + division / minorDivisions;
          if (minorX < minX || minorX > maxX) continue;
          drawVerticalLine(minorX, minorStroke, 1);
        }
      }
    }

    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y += 1) {
      drawHorizontalLine(y, majorStroke, 1.25);

      if (minorDivisions > 1) {
        for (let division = 1; division < minorDivisions; division += 1) {
          const minorY = y + division / minorDivisions;
          if (minorY < minY || minorY > maxY) continue;
          drawHorizontalLine(minorY, minorStroke, 1);
        }
      }
    }

    ctx.restore();
  }

  function renderPolygon(
    ctx: CanvasRenderingContext2D,
    transform: ViewTransform,
    polygon: ReadonlyPolygon,
    options?: {
      noFill?: boolean;
      stroke?: boolean;
      vertices?: boolean;
      dimmed?: boolean;
      draft?: boolean;
    },
  ) {
    const noFill = options?.noFill ?? false;
    const stroke = options?.stroke ?? false;
    const vertices = options?.vertices ?? false;
    const dimmed = options?.dimmed ?? false;
    const draft = options?.draft ?? false;
    if (!polygon.vertices.length) return;

    ctx.save();
    ctx.beginPath();

    drawPolygonOnCanvas(ctx, polygon.vertices, p => worldToCanvas(p, transform));

    if (polygon.vertices.length >= 3) {
      ctx.closePath();
    }

    if (!noFill && polygon.vertices.length >= 3) {
      let fillAlpha = draft ? 0.45 : 1;
      if (dimmed) {
        fillAlpha = Math.min(fillAlpha, 0.84);
      }
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = polygon.color;
      ctx.fill();
    }

    if (draft) {
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = polygon.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    else if (stroke) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = polygon.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    if (vertices) {
      polygon.vertices.forEach((vertex, index) => {
        const canvasPoint = worldToCanvas(vertex, transform);
        const isSelectedVertex = selectedPolygonId.value === polygon.id && selectedVertexIndex.value === index;

        if (isSelectedVertex) {
          ctx.beginPath();
          ctx.arc(canvasPoint.x, canvasPoint.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = polygon.color;
          ctx.lineWidth = 2.5;
          ctx.fill();
          ctx.stroke();
        }
        else {
          ctx.beginPath();
          ctx.arc(canvasPoint.x, canvasPoint.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = polygon.color;
          ctx.fill();
        }
      });
    }

    ctx.restore();
  }

  function renderCanvas(renderHooks?: RenderHooks) {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const metrics = getCanvasMetrics();
    if (!metrics) return;

    const transform = getViewTransform(metrics, logicalBounds.value);

    const width = Math.max(1, Math.round(metrics.width * metrics.dpr));
    const height = Math.max(1, Math.round(metrics.height * metrics.dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
    ctx.clearRect(0, 0, metrics.width, metrics.height);

    const renderHookArgs = {
      editor,
      ctx,
      metrics,
      transform,
      worldToCanvas: (point: Vec2) => worldToCanvas(point, transform),
      worldRectToCanvas(rect: Rect) {
        let { x: x1, y: y1 } = worldToCanvas(rect, transform);
        let { x: x2, y: y2 } = worldToCanvas({ x: rect.x + rect.width, y: rect.y + rect.height }, transform);
        if (x2 < x1) {
          [x1, x2] = [x2, x1];
        }
        if (y2 < y1) {
          [y1, y2] = [y2, y1];
        }
        return {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        };
      },
    };

    if (renderHooks?.onBeforeRenderPolygons) {
      renderHooks.onBeforeRenderPolygons(renderHookArgs);
    }

    renderGrid(ctx, transform);

    const hasSelectedPolygon = selectedPolygonId.value !== null;
    const selectedPolygonItem = hasSelectedPolygon
      ? editorState.value.polygons.find(polygon => polygon.id === selectedPolygonId.value) ?? null
      : null;

    for (const polygon of editorState.value.polygons) {
      renderPolygon(ctx, transform, polygon, {
        dimmed: hasSelectedPolygon && polygon.id !== selectedPolygonId.value,
      });
    }

    if (renderHooks?.onBeforeRenderSelection) {
      renderHooks.onBeforeRenderSelection(renderHookArgs);
    }

    if (selectedPolygonItem) {
      renderPolygon(ctx, transform, selectedPolygonItem, {
        noFill: true,
        stroke: true,
        vertices: true,
      });
    }

    if (draftPolygon.value) {
      renderPolygon(ctx, transform, draftPolygon.value, {
        draft: true,
        vertices: true,
      });
    }

    if (draftRectangle.value) {
      const { start, current } = draftRectangle.value;
      const polygon = createRectanglePolygon(start, current, draftRectangle.value.color);
      renderPolygon(ctx, transform, polygon, {
        draft: true,
        vertices: true,
      });
    }

    if (renderHooks?.onAfterRender) {
      renderHooks.onAfterRender(renderHookArgs);
    }
  }

  return {
    worldToCanvas,
    canvasToWorld,
    canvasToWorldRaw,
    findHitEdge,
    findHitPolygon,
    findHitVertex,
    getCanvasMetrics,
    renderCanvas,
  };
}
