import type { DeepReadonly, Ref } from 'vue';
import type { Vec2 } from '~/utils/utils';
import { snapPointWithGrid, type PolygonEditorGrid, type PolygonEditorValue } from '~/utils/polygonEditorCore';
import { HANDLE_HIT_THRESHOLD_PX } from '~/utils/polygonEditorCore';

export type PolygonEditorMode = 'select' | 'drawPolygon' | 'drawRectangle';

export interface UsePolygonEditorOptions {
  props: DeepReadonly<{
    logicalBounds: { width: number; height: number };
    disabled?: boolean;
    readonly?: boolean;
  }>;
  grid: Ref<PolygonEditorGrid>;
  model: Ref<PolygonEditorValue>;
  emitChange: (snapshot: PolygonEditorValue) => void;
  renderCanvas: () => void;
}

export function usePolygonEditor(options: UsePolygonEditorOptions) {
  const { props, grid, model, emitChange, renderCanvas } = options;

  // 編集対象の状態管理
  const editorState = ref(clonePolygonEditorValue(model.value));
  const { commit, undo, redo, canUndo, canRedo } = useManualRefHistory(editorState, {
    clone: clonePolygonEditorValue,
  });

  function publishState() {
    const snapshot = clonePolygonEditorValue(editorState.value);
    model.value = snapshot;
    emitChange(snapshot);
    return snapshot;
  }

  function finishChange() {
    publishState();
    commit();
    renderCanvas();
  }

  function performUndo() {
    if (!canUndo.value) return;
    clearTransientInteraction();
    undo();
    normalizeSelection();
    publishState();
    renderCanvas();
  }

  function performRedo() {
    if (!canRedo.value) return;
    clearTransientInteraction();
    redo();
    normalizeSelection();
    publishState();
    renderCanvas();
  }

  function applyStateChange(mutator: (state: PolygonEditorValue) => void) {
    if (editingLocked.value) return;
    mutator(editorState.value);
    normalizeSelection();
    finishChange();
  }

  function normalizeSelection() {
    if (!editorState.value.polygons.length) {
      selectedPolygonId.value = null;
      selectedVertexIndex.value = null;
      return;
    }

    if (!selectedPolygonId.value || !editorState.value.polygons.some(polygon => polygon.id === selectedPolygonId.value)) {
      selectedPolygonId.value = editorState.value.polygons[editorState.value.polygons.length - 1]?.id ?? null;
      selectedVertexIndex.value = null;
    }

    const polygon = selectedPolygon.value;
    if (!polygon) {
      selectedVertexIndex.value = null;
      return;
    }

    if (selectedVertexIndex.value === null) return;
    selectedVertexIndex.value = Math.max(0, Math.min(selectedVertexIndex.value, polygon.vertices.length - 1));
  }

  // エディタ用の状態
  const selectedPolygonId = ref<number | null>(editorState.value.polygons[0]?.id ?? null);
  const selectedVertexIndex = ref<number | null>(null);
  const mode = ref<PolygonEditorMode>('select');
  const draftPolygon = ref<PolygonEditorPolygon | null>(null);
  const draftRectangle = ref<PolygonDraftRectangle | null>(null);
  const dragState = ref<{
    polygonId: number;
    vertexIndex: number;
    pointerId: number;
    original: Vec2;
  } | null>(null);

  const logicalBounds = computed(() => ({
    minX: 0,
    minY: 0,
    maxX: props.logicalBounds.width,
    maxY: props.logicalBounds.height,
  }));
  const editingLocked = computed(() => props.disabled || props.readonly || false);

  const selectedPolygonIndex = computed(() => {
    if (!selectedPolygonId.value) return -1;
    return editorState.value.polygons.findIndex(polygon => polygon.id === selectedPolygonId.value);
  });
  const selectedPolygon = computed(() => editorState.value.polygons[selectedPolygonIndex.value] ?? null);

  function getNextPolygonId() {
    let nextId = 1;
    for (const polygon of editorState.value.polygons) {
      nextId = Math.max(nextId, polygon.id + 1);
    }
    return nextId;
  }

  // ユーティリティ関数
  function snapPoint(point: Vec2, clampBounds?: boolean) {
    return snapPointWithGrid(point, grid.value, clampBounds ? logicalBounds.value : undefined);
  }

  function createPolygon(vertices: Vec2[], color = getNextPolygonColor()) {
    return {
      id: getNextPolygonId(),
      color,
      vertices: clampVerticesToLogicalBounds(vertices.map(clonePoint), logicalBounds.value),
    } satisfies PolygonEditorPolygon;
  }

  function createRectanglePolygon(start: Vec2, end: Vec2, color: string) {
    return createPolygon(createRectangleVertices(start, end, logicalBounds.value), color);
  }

  // モード切り替え
  function activateSelectMode() {
    if (editingLocked.value) return;
    clearTransientInteraction();
    mode.value = 'select';
    renderCanvas();
  }

  function activatePolygonMode() {
    if (editingLocked.value) return;
    if (mode.value !== 'drawPolygon' || !draftPolygon.value) {
      startPolygonDraft();
    }
    mode.value = 'drawPolygon';
    renderCanvas();
  }

  function activateRectangleMode() {
    if (editingLocked.value) return;
    if (mode.value !== 'drawRectangle' || !draftRectangle.value) {
      startRectangleDraft();
    }
    mode.value = 'drawRectangle';
    renderCanvas();
  }

  // 選択関連
  function selectPolygon(polygonId: number | null, vertexIndex: number | null = null) {
    if (mode.value !== 'select') return;
    selectedPolygonId.value = polygonId;
    selectedVertexIndex.value = polygonId ? vertexIndex : null;
    renderCanvas();
  }

  function selectVertex(index: number) {
    selectedVertexIndex.value = index;
    renderCanvas();
  }

  function clearSelection() {
    selectPolygon(null, null);
  }

  // 編集アクション

  function duplicatePolygon(id: number) {
    if (editingLocked.value) return;

    clearTransientInteraction();
    applyStateChange((state) => {
      const index = state.polygons.findIndex(item => item.id === id);
      const polygon = state.polygons[index];
      if (!polygon) return;

      const duplicated = createPolygon(
        polygon.vertices.map(vertex => ({
          x: vertex.x + 0.5,
          y: vertex.y + 0.5,
        })),
        polygon.color,
      );

      state.polygons.splice(Math.max(0, index + 1), 0, duplicated);
      selectPolygon(duplicated.id, null);
    });
  }

  function deletePolygon(id: number) {
    if (editingLocked.value) return;

    clearTransientInteraction();
    applyStateChange((state) => {
      const index = state.polygons.findIndex(polygon => polygon.id === id);
      if (index === -1) return;

      state.polygons.splice(index, 1);
      clearSelection();
    });
  }

  function deleteVertex(polygonId: number, vertexIndex: number) {
    if (editingLocked.value) return;

    applyStateChange((state) => {
      const index = state.polygons.findIndex(polygon => polygon.id === polygonId);
      const polygon = state.polygons[index];
      if (!polygon) return;
      if (polygon.vertices.length <= 3) {
        state.polygons.splice(index, 1);
        clearSelection();
        return;
      }
      if (vertexIndex < 0 || polygon.vertices.length <= vertexIndex) return;
      polygon.vertices.splice(vertexIndex, 1);
      selectedVertexIndex.value = null;
      renderCanvas();
    });
  }

  function insertMidpoint(polygonId: number, vertexIndex: number) {
    if (editingLocked.value) return;

    applyStateChange((state) => {
      const index = state.polygons.findIndex(polygon => polygon.id === polygonId);
      const polygon = state.polygons[index];
      if (!polygon || polygon.vertices.length < 2) return;

      const nextIndex = (vertexIndex + 1) % polygon.vertices.length;
      const v1 = polygon.vertices[vertexIndex];
      const v2 = polygon.vertices[nextIndex];
      if (!v1 || !v2) return;
      const midpoint = snapPoint({
        x: (v1.x + v2.x) / 2,
        y: (v1.y + v2.y) / 2,
      });

      polygon.vertices.splice(nextIndex, 0, midpoint);
      selectVertex(nextIndex);
    });
  }

  function insertVertexAtEdge(edgeHit: HitEdge) {
    applyStateChange((state) => {
      const polygon = state.polygons.find(item => item.id === edgeHit.polygonId);
      if (!polygon) return;
      const insertIndex = (edgeHit.edgeIndex + 1) % polygon.vertices.length;
      polygon.vertices.splice(insertIndex, 0, edgeHit.point);
      selectPolygon(polygon.id, insertIndex);
    });
  }

  function updateVertexCoordinateWithoutCommit(polygonId: number, vertexIndex: number, value: { x?: number; y?: number }, state?: PolygonEditorValue) {
    const s = state ?? editorState.value;
    const index = s.polygons.findIndex(item => item.id === polygonId);
    const polygon = s.polygons[index];
    if (!polygon || !polygon.vertices[vertexIndex]) return;

    const newVertex = { ...polygon.vertices[vertexIndex] };
    Object.assign(newVertex, value);
    polygon.vertices[vertexIndex] = clampToLogicalBounds(newVertex, logicalBounds.value);
  }

  function updateVertexCoordinate(polygonId: number, vertexIndex: number, value: { x?: number; y?: number }) {
    if (editingLocked.value) return;

    applyStateChange((state) => {
      updateVertexCoordinateWithoutCommit(polygonId, vertexIndex, value, state);
    });
  }

  // ポリゴン作成関連
  function clearTransientInteraction() {
    if (dragState.value) {
      const polygon = editorState.value.polygons.find(item => item.id === dragState.value?.polygonId);
      if (polygon && polygon.vertices[dragState.value.vertexIndex]) {
        polygon.vertices[dragState.value.vertexIndex] = clonePoint(dragState.value.original);
      }
    }

    dragState.value = null;
    draftPolygon.value = null;
    draftRectangle.value = null;
  }

  function startPolygonDraft() {
    if (editingLocked.value) return;
    clearTransientInteraction();
    draftPolygon.value = {
      id: -1,
      color: getNextPolygonColor(),
      vertices: [],
    };
    clearSelection();
  }

  function addDraftPoint(point: Vec2) {
    if (editingLocked.value || !draftPolygon.value) return;
    draftPolygon.value.vertices.push(snapPoint(point));
    renderCanvas();
  }

  function cancelDraft() {
    draftPolygon.value = null;
    renderCanvas();
  }

  function completePolygon(point: Vec2) {
    if (!draftPolygon.value || draftPolygon.value.vertices.length < 3) return false;
    const first = draftPolygon.value.vertices[0];
    if (!first) return false;
    const distance = Math.hypot(point.x - first.x, point.y - first.y);
    return distance <= HANDLE_HIT_THRESHOLD_PX / GRID_SCALE;
  }

  function finalizeDraftPolygon() {
    if (editingLocked.value) return;
    if (!draftPolygon.value || draftPolygon.value.vertices.length < 3) {
      cancelDraft();
      return;
    }

    const draft = createPolygon(draftPolygon.value.vertices, draftPolygon.value.color);
    clearTransientInteraction();

    applyStateChange((state) => {
      state.polygons.push(draft);
      selectPolygon(draft.id, null);
    });
  }

  // 矩形作成関連
  function startRectangleDraft() {
    if (editingLocked.value) return;
    clearTransientInteraction();
    clearSelection();
  }

  function finalizeRectangleDraft() {
    if (editingLocked.value || !draftRectangle.value) return false;

    const { start, current, color } = draftRectangle.value;
    if (start.x === current.x && start.y === current.y) {
      draftRectangle.value = null;
      renderCanvas();
      return false;
    }

    const polygon = createRectanglePolygon(start, current, color);
    draftRectangle.value = null;
    applyStateChange((state) => {
      state.polygons.push(polygon);
      selectedPolygonId.value = polygon.id;
      selectedVertexIndex.value = null;
    });

    return true;
  }

  function commitCanvasDrag() {
    if (!dragState.value) return;
    dragState.value = null;
    finishChange();
  }

  function cancelCanvasDrag() {
    if (!dragState.value) return;

    const polygon = editorState.value.polygons.find(item => item.id === dragState.value?.polygonId);
    if (polygon && polygon.vertices[dragState.value.vertexIndex]) {
      polygon.vertices[dragState.value.vertexIndex] = clonePoint(dragState.value.original);
    }

    dragState.value = null;
    renderCanvas();
  }

  return {
    grid,
    editorState: readonly(editorState),
    selectedPolygonId,
    selectedVertexIndex,
    selectedPolygonIndex,
    selectedPolygon,
    mode,
    draftPolygon,
    draftRectangle,
    dragState,
    editingLocked,
    logicalBounds,
    canUndo,
    canRedo,
    snapPoint,
    createPolygon,
    createRectanglePolygon,
    activateSelectMode,
    activatePolygonMode,
    activateRectangleMode,
    performUndo,
    performRedo,
    applyStateChange,
    selectPolygon,
    selectVertex,
    clearSelection,
    duplicatePolygon,
    deletePolygon,
    deleteVertex,
    insertMidpoint,
    insertVertexAtEdge,
    updateVertexCoordinateWithoutCommit,
    updateVertexCoordinate,
    clearTransientInteraction,
    addDraftPoint,
    cancelDraft,
    completePolygon,
    finalizeDraftPolygon,
    finalizeRectangleDraft,
    commitCanvasDrag,
    cancelCanvasDrag,
  };
}

export type PolygonEditor = ReturnType<typeof usePolygonEditor>;
