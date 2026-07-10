import type { ComputedRef, Ref } from 'vue';
import {
  findHitEdge as findHitEdgeInPolygons,
  findHitPolygon as findHitPolygonInPolygons,
  findHitVertex as findHitVertexInPolygons,
  getViewTransform,
  GRID_SCALE,
  HANDLE_HIT_THRESHOLD_PX,
  worldToCanvas as worldToCanvasWithBounds,
} from '../utils/polygonEditorCore';
import type {
  CanvasMetrics,
  HitEdge,
  HitVertex,
  LogicalBounds,
  PolygonEditorPoint,
  PolygonEditorPolygon,
  PolygonEditorValue,
} from '../utils/polygonEditorCore';

export type PolygonDraftRectangle = {
  start: PolygonEditorPoint;
  current: PolygonEditorPoint;
  color: string;
};

type UsePolygonCanvasOptions = {
  canvasRef: Ref<HTMLCanvasElement | null>;
  logicalBounds: ComputedRef<LogicalBounds>;
  editorState: Ref<PolygonEditorValue>;
  selectedPolygonId: Ref<number | null>;
  selectedVertexIndex: Ref<number | null>;
  draftPolygon: Ref<PolygonEditorPolygon | null>;
  draftRectangle: Ref<PolygonDraftRectangle | null>;
  snapPoint: (point: PolygonEditorPoint) => PolygonEditorPoint;
  createRectanglePolygon: (start: PolygonEditorPoint, end: PolygonEditorPoint, color?: string) => PolygonEditorPolygon;
};

export function usePolygonCanvas(options: UsePolygonCanvasOptions) {
  const {
    canvasRef,
    logicalBounds,
    editorState,
    selectedPolygonId,
    selectedVertexIndex,
    draftPolygon,
    draftRectangle,
    snapPoint,
    createRectanglePolygon,
  } = options;

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

  function worldToCanvas(point: PolygonEditorPoint, metrics: CanvasMetrics) {
    return worldToCanvasWithBounds(point, metrics, logicalBounds.value);
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

  function findHitVertex(point: PolygonEditorPoint) {
    return findHitVertexInPolygons(
      point,
      editorState.value.polygons,
      HANDLE_HIT_THRESHOLD_PX / GRID_SCALE,
    ) as HitVertex | null;
  }

  function findHitEdge(point: PolygonEditorPoint) {
    return findHitEdgeInPolygons(
      point,
      editorState.value.polygons,
      HANDLE_HIT_THRESHOLD_PX / GRID_SCALE,
      snapPoint,
    ) as HitEdge | null;
  }

  function findHitPolygon(point: PolygonEditorPoint) {
    return findHitPolygonInPolygons(point, editorState.value.polygons);
  }

  function renderGrid(ctx: CanvasRenderingContext2D, metrics: CanvasMetrics) {
    if (!editorState.value.grid.enabled) return;

    const minorDivisions = Math.max(1, editorState.value.grid.minorDivisions);
    const transform = getViewTransform(metrics, logicalBounds.value);
    const minX = logicalBounds.value.minX;
    const maxX = logicalBounds.value.maxX;
    const minY = logicalBounds.value.minY;
    const maxY = logicalBounds.value.maxY;
    const majorStroke = 'rgba(148, 163, 184, 0.32)';
    const minorStroke = 'rgba(148, 163, 184, 0.12)';
    const topLeft = worldToCanvas({ x: minX, y: maxY }, metrics);
    const bottomRight = worldToCanvas({ x: maxX, y: minY }, metrics);

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
      ctx.moveTo(x, 0);
      ctx.lineTo(x, metrics.height);
      ctx.stroke();
    };

    const drawHorizontalLine = (worldY: number, strokeStyle: string, width: number) => {
      const y = transform.offsetY - worldY * transform.scale;
      ctx.beginPath();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = width;
      ctx.moveTo(0, y);
      ctx.lineTo(metrics.width, y);
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
    metrics: CanvasMetrics,
    polygon: PolygonEditorPolygon,
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

    polygon.vertices.forEach((vertex, index) => {
      const canvasPoint = worldToCanvas(vertex, metrics);
      if (index === 0) {
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
      }
      else {
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    });

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
        const canvasPoint = worldToCanvas(vertex, metrics);
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

  function renderCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const metrics = getCanvasMetrics();
    if (!metrics) return;

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
    ctx.fillStyle = editorState.value.backgroundColor;
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    renderGrid(ctx, metrics);

    const hasSelectedPolygon = selectedPolygonId.value !== null;
    const selectedPolygonItem = hasSelectedPolygon
      ? editorState.value.polygons.find(polygon => polygon.id === selectedPolygonId.value) ?? null
      : null;

    for (const polygon of editorState.value.polygons) {
      renderPolygon(ctx, metrics, polygon, {
        dimmed: hasSelectedPolygon && polygon.id !== selectedPolygonId.value,
      });
    }

    if (selectedPolygonItem) {
      renderPolygon(ctx, metrics, selectedPolygonItem, {
        noFill: true,
        stroke: true,
        vertices: true,
      });
    }

    if (draftPolygon.value) {
      renderPolygon(ctx, metrics, draftPolygon.value, {
        draft: true,
        vertices: true,
      });
    }

    if (draftRectangle.value) {
      const { start, current } = draftRectangle.value;
      const polygon = createRectanglePolygon(start, current, draftRectangle.value.color);
      renderPolygon(ctx, metrics, polygon, {
        draft: true,
        vertices: true,
      });
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
