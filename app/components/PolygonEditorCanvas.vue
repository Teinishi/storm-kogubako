<script setup lang="ts">
import { usePolygonEditorContext } from '~/composables/useEditorContext';
import { usePolygonEditorCanvas } from '~/composables/usePolygonEditorCanvas';

const surfaceRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const editor = usePolygonEditorContext();
const {
  canvasToWorld,
  canvasToWorldRaw,
  findHitVertex,
  findHitEdge,
  findHitPolygon,
  renderCanvas,
} = usePolygonEditorCanvas({
  canvasRef,
  editor,
});

defineExpose({ renderCanvas });

const {
  editorState,
  mode,
  selectedVertexIndex,
  draftPolygon,
  draftRectangle,
  dragState,
  editingLocked,
  logicalBounds,
  selectedPolygonId,
  snapPoint,
  performUndo,
  performRedo,
  selectPolygon,
  clearSelection,
  deletePolygon,
  deleteVertex,
  insertVertexAtEdge,
  updateVertexCoordinateWithoutCommit,
  addDraftPoint,
  cancelDraft,
  completePolygon,
  finalizeDraftPolygon,
  finalizeRectangleDraft,
  commitCanvasDrag,
  cancelCanvasDrag,
} = editor;

function handleCanvasPointerDown(event: PointerEvent) {
  if (editingLocked.value) return;

  surfaceRef.value?.focus();

  const rawWorldPoint = canvasToWorldRaw(event.clientX, event.clientY);

  if (event.button === 2) {
    // 右クリック
    if (mode.value === 'drawPolygon' && draftPolygon.value) {
      finalizeDraftPolygon();
      mode.value = 'select';
      event.preventDefault();
      return;
    }

    if (mode.value === 'select') {
      const vertexHit = findHitVertex(rawWorldPoint);
      if (vertexHit && vertexHit.polygonId === selectedPolygonId.value) {
        deleteVertex(vertexHit.polygonId, vertexHit.vertexIndex);
        event.preventDefault();
      }
    }
    return;
  }

  if (event.button !== 0) return;

  // 頂点クリック
  const vertexHit = findHitVertex(rawWorldPoint);
  if (mode.value === 'select' && vertexHit) {
    if (vertexHit.polygonId !== selectedPolygonId.value) {
      selectPolygon(vertexHit.polygonId, vertexHit.vertexIndex);
      event.preventDefault();
      return;
    }

    selectPolygon(vertexHit.polygonId, vertexHit.vertexIndex);
    const polygon = editorState.value.polygons.find(item => item.id === vertexHit.polygonId);
    if (!polygon) return;

    dragState.value = {
      polygonId: vertexHit.polygonId,
      vertexIndex: vertexHit.vertexIndex,
      pointerId: event.pointerId,
      original: clonePoint(polygon.vertices[vertexHit.vertexIndex] ?? { x: 0, y: 0 }),
    };

    const target = event.currentTarget as HTMLCanvasElement | null;
    target?.setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }

  // 辺クリック
  const edgeHit = findHitEdge(rawWorldPoint);
  if (mode.value === 'select' && edgeHit && edgeHit.polygonId === selectedPolygonId.value) {
    insertVertexAtEdge(edgeHit);
    event.preventDefault();
    return;
  }

  // 範囲外クリック
  if (!isWithinLogicalBounds(rawWorldPoint, logicalBounds.value)) {
    if (mode.value === 'select') {
      clearSelection();
    }
    return;
  }
  const worldPoint = snapPoint(rawWorldPoint);

  if (mode.value === 'drawRectangle') {
    if (!draftRectangle.value) {
      draftRectangle.value = {
        start: worldPoint,
        current: worldPoint,
        color: getNextPolygonColor(),
      };
    }
    else {
      draftRectangle.value.current = worldPoint;
    }

    const target = event.currentTarget as HTMLCanvasElement | null;
    target?.setPointerCapture(event.pointerId);
    event.preventDefault();
    renderCanvas();
    return;
  }

  if (mode.value === 'drawPolygon') {
    if (draftPolygon.value && completePolygon(worldPoint)) {
      finalizeDraftPolygon();
      mode.value = 'select';
      event.preventDefault();
      return;
    }

    addDraftPoint(worldPoint);

    const target = event.currentTarget as HTMLCanvasElement | null;
    target?.setPointerCapture(event.pointerId);
    event.preventDefault();
    return;
  }

  const polygonHit = findHitPolygon(worldPoint);
  if (polygonHit) {
    selectPolygon(polygonHit.id, null);
    event.preventDefault();
    return;
  }

  if (mode.value === 'select') {
    clearSelection();
  }
}

function handleCanvasPointerMove(event: PointerEvent) {
  if (mode.value === 'drawRectangle' && draftRectangle.value) {
    draftRectangle.value.current = clampToLogicalBounds(canvasToWorld(event.clientX, event.clientY), logicalBounds.value);
    renderCanvas();
    return;
  }

  if (!dragState.value || dragState.value.pointerId !== event.pointerId || editingLocked.value) return;

  const polygon = editorState.value.polygons.find(item => item.id === dragState.value?.polygonId);
  if (!polygon) return;

  updateVertexCoordinateWithoutCommit(dragState.value.polygonId, dragState.value.vertexIndex, canvasToWorld(event.clientX, event.clientY));
  renderCanvas();
}

function handleCanvasPointerUp(event: PointerEvent) {
  if (mode.value === 'drawRectangle' && draftRectangle.value) {
    draftRectangle.value.current = clampToLogicalBounds(canvasToWorld(event.clientX, event.clientY), logicalBounds.value);
    finalizeRectangleDraft();
    event.preventDefault();
    return;
  }

  if (!dragState.value || dragState.value.pointerId !== event.pointerId) return;
  commitCanvasDrag();
}

function handleCanvasPointerLeave() {
  if (!dragState.value) return;
  commitCanvasDrag();
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
    return;
  }

  if (editingLocked.value) return;

  const isMeta = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  if (isMeta && key === 'z' && !event.shiftKey) {
    event.preventDefault();
    performUndo();
    return;
  }

  if ((isMeta && key === 'y') || (isMeta && key === 'z' && event.shiftKey)) {
    event.preventDefault();
    performRedo();
    return;
  }

  if (event.key === 'Escape') {
    if (dragState.value) {
      event.preventDefault();
      cancelCanvasDrag();
      return;
    }

    if (draftPolygon.value) {
      event.preventDefault();
      cancelDraft();
      mode.value = 'select';
    }

    if (draftRectangle.value) {
      event.preventDefault();
      draftRectangle.value = null;
      mode.value = 'select';
    }
    return;
  }

  if (event.key === 'Enter' && draftPolygon.value) {
    event.preventDefault();
    finalizeDraftPolygon();
    mode.value = 'select';
    return;
  }

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedPolygonId.value) {
    event.preventDefault();
    if (selectedVertexIndex.value !== null) {
      deleteVertex(selectedPolygonId.value, selectedVertexIndex.value);
    }
    else {
      deletePolygon(selectedPolygonId.value);
    }
  }
}

function focusSurface() {
  surfaceRef.value?.focus();
}

onMounted(() => {
  renderCanvas();
});

useResizeObserver(surfaceRef, renderCanvas);
</script>

<template>
  <div
    ref="surfaceRef"
    tabindex="0"
    class="min-h-128 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 outline-none shadow-sm dark:border-gray-800 dark:bg-gray-950"
    :class="editingLocked ? 'cursor-not-allowed' : 'cursor-crosshair'"
    @keydown="handleKeydown"
    @pointerdown="focusSurface"
  >
    <canvas
      ref="canvasRef"
      class="block h-full w-full select-none touch-none"
      @pointerdown="handleCanvasPointerDown"
      @pointermove="handleCanvasPointerMove"
      @pointerup="handleCanvasPointerUp"
      @pointerleave="handleCanvasPointerLeave"
      @pointercancel="cancelCanvasDrag"
      @contextmenu.prevent
    />
  </div>
</template>
