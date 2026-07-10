<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useManualRefHistory, useResizeObserver } from '@vueuse/core';
import { usePolygonCanvas, type PolygonDraftRectangle } from '../composables/usePolygonCanvas';
import {
  clampToLogicalBounds,
  clampVerticesToLogicalBounds,
  clonePoint,
  clonePolygonEditorValue,
  createDefaultPolygonEditorValue,
  createRectangleVertices,
  DEFAULT_POLYGON_COLOR,
  getNextPolygonColor,
  isWithinLogicalBounds,
  roundCoordinate,
  snapPoint as snapPointWithGrid,
  HANDLE_HIT_THRESHOLD_PX,
} from '../utils/polygonEditorCore';
import type {
  HitEdge,
  PolygonEditorPoint,
  PolygonEditorPolygon,
  PolygonEditorValue,
} from '../utils/polygonEditorCore';

type DraftRectangle = PolygonDraftRectangle;

const props = withDefaults(defineProps<{
  logicalWidth?: number;
  logicalHeight?: number;
  disabled?: boolean;
  readonly?: boolean;
}>(), {
  logicalWidth: undefined,
  logicalHeight: undefined,
  disabled: false,
  readonly: false,
});

const { t } = useI18n({ useScope: 'local' });

const emit = defineEmits<{
  (event: 'change', value: PolygonEditorValue): void;
}>();

const model = defineModel<PolygonEditorValue | undefined>();
if (!model.value) {
  model.value = createDefaultPolygonEditorValue();
}

const editorState = ref(clonePolygonEditorValue(model.value));
const surfaceRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const selectedPolygonId = ref<number | null>(editorState.value.polygons[0]?.id ?? null);
const selectedVertexIndex = ref<number | null>(null);
const mode = ref<'select' | 'drawPolygon' | 'drawRectangle'>('select');
const draftPolygon = ref<PolygonEditorPolygon | null>(null);
const draftRectangle = ref<DraftRectangle | null>(null);
const dragState = ref<{
  polygonId: number;
  vertexIndex: number;
  pointerId: number;
  original: PolygonEditorPoint;
} | null>(null);

const logicalBounds = computed(() => ({
  minX: 0,
  minY: 0,
  maxX: props.logicalWidth ?? 10,
  maxY: props.logicalHeight ?? 10,
}));

const editingLocked = computed(() => props.disabled || props.readonly);

const selectedPolygonIndex = computed(() => {
  if (!selectedPolygonId.value) return -1;
  return editorState.value.polygons.findIndex(polygon => polygon.id === selectedPolygonId.value);
});
const selectedPolygon = computed(() => editorState.value.polygons[selectedPolygonIndex.value] ?? null);
const polygonsForList = computed(() => [...editorState.value.polygons].reverse());

const { commit, undo, redo, canUndo, canRedo } = useManualRefHistory(editorState, {
  clone: clonePolygonEditorValue,
});

const backgroundColorProxy = computed({
  get: () => editorState.value.backgroundColor,
  set: (value: string) => {
    applyStateChange((state) => {
      state.backgroundColor = value;
    });
  },
});

const gridEnabledProxy = computed({
  get: () => editorState.value.grid.enabled,
  set: (value: boolean) => {
    applyStateChange((state) => {
      state.grid.enabled = value;
    });
  },
});

const minorDivisionsProxy = computed({
  get: () => editorState.value.grid.minorDivisions,
  set: (value: number | null) => {
    applyStateChange((state) => {
      state.grid.minorDivisions = Math.max(1, Math.round(value ?? 1));
    });
  },
});

const selectedPolygonColorProxy = computed({
  get: () => selectedPolygon.value?.color ?? DEFAULT_POLYGON_COLOR,
  set: (value: string) => {
    if (!selectedPolygon.value) return;
    applyStateChange((state) => {
      const polygon = state.polygons.find(item => item.id === selectedPolygonId.value);
      if (!polygon) return;
      polygon.color = value;
    });
  },
});

function getNextPolygonId() {
  let nextId = 1;
  for (const polygon of editorState.value.polygons) {
    nextId = Math.max(nextId, polygon.id + 1);
  }
  return nextId;
}

function createPolygon(vertices: PolygonEditorPoint[], color = getNextPolygonColor()) {
  return {
    id: getNextPolygonId(),
    color,
    vertices: clampVerticesToLogicalBounds(vertices.map(clonePoint), logicalBounds.value),
  } satisfies PolygonEditorPolygon;
}

function createDraftPolygon() {
  return {
    id: -1,
    color: getNextPolygonColor(),
    vertices: [],
  } satisfies PolygonEditorPolygon;
}

function createRectanglePolygon(start: PolygonEditorPoint, end: PolygonEditorPoint, color = DEFAULT_POLYGON_COLOR) {
  return createPolygon(createRectangleVertices(start, end, logicalBounds.value), color);
}

function snapPoint(point: PolygonEditorPoint) {
  return snapPointWithGrid(point, editorState.value.grid, logicalBounds.value);
}

const {
  canvasToWorld,
  canvasToWorldRaw,
  findHitEdge,
  findHitPolygon,
  findHitVertex,
  renderCanvas,
} = usePolygonCanvas({
  canvasRef,
  logicalBounds,
  editorState,
  selectedPolygonId,
  selectedVertexIndex,
  draftPolygon,
  draftRectangle,
  snapPoint,
  createRectanglePolygon,
});

function publishState() {
  const snapshot = clonePolygonEditorValue(editorState.value);
  model.value = snapshot;
  emit('change', snapshot);
  return snapshot;
}

function finishChange() {
  publishState();
  commit();
  renderCanvas();
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

function applyStateChange(mutator: (state: PolygonEditorValue) => void) {
  if (editingLocked.value) return;
  mutator(editorState.value);
  normalizeSelection();
  finishChange();
}

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

function selectPolygon(polygonId: number | null, vertexIndex: number | null = null) {
  selectedPolygonId.value = polygonId;
  selectedVertexIndex.value = polygonId ? vertexIndex : null;
  renderCanvas();
}

function selectVertex(index: number) {
  selectedVertexIndex.value = index;
  renderCanvas();
}

function startPolygonDraft() {
  if (editingLocked.value) return;
  clearTransientInteraction();
  draftPolygon.value = createDraftPolygon();
  selectedVertexIndex.value = null;
  renderCanvas();
}

function startRectangleDraft() {
  if (editingLocked.value) return;
  clearTransientInteraction();
  draftRectangle.value = null;
  selectedVertexIndex.value = null;
  renderCanvas();
}

function cancelDraft() {
  draftPolygon.value = null;
  renderCanvas();
}

function addDraftPoint(point: PolygonEditorPoint) {
  if (editingLocked.value || !draftPolygon.value) return;
  draftPolygon.value.vertices.push(snapPoint(point));
  renderCanvas();
}

function completePolygon(point: PolygonEditorPoint) {
  if (!draftPolygon.value || draftPolygon.value.vertices.length < 3) return false;
  const first = draftPolygon.value.vertices[0];
  if (!first) return false;
  const distance = Math.hypot(point.x - first.x, point.y - first.y);
  return distance <= HANDLE_HIT_THRESHOLD_PX / GRID_SCALE;
}

function finalizeDraft() {
  if (editingLocked.value) return;
  if (!draftPolygon.value || draftPolygon.value.vertices.length < 3) {
    cancelDraft();
    return;
  }

  const draft = createPolygon(draftPolygon.value.vertices, draftPolygon.value.color);
  clearTransientInteraction();

  applyStateChange((state) => {
    state.polygons.push(draft);
    selectedPolygonId.value = draft.id;
    selectedVertexIndex.value = null;
  });
}

function finalizeRectangleDraft() {
  if (editingLocked.value || !draftRectangle.value) return;

  const { start, current, color } = draftRectangle.value;
  if (start.x === current.x && start.y === current.y) {
    draftRectangle.value = null;
    renderCanvas();
    return;
  }

  const polygon = createRectanglePolygon(start, current, color);
  draftRectangle.value = null;
  applyStateChange((state) => {
    state.polygons.push(polygon);
    selectedPolygonId.value = polygon.id;
    selectedVertexIndex.value = null;
  });
}

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

function clearSelection() {
  selectPolygon(null, null);
}

function handlePolygonListClick(polygonId: number) {
  if (selectedPolygonId.value === polygonId) {
    clearSelection();
    return;
  }

  selectPolygon(polygonId, null);
}

function handlePolygonListReorder(payload: { fromIndex: number; toIndex: number }) {
  if (editingLocked.value) return;
  applyStateChange((state) => {
    const frontToBack = [...state.polygons].reverse();
    const { fromIndex, toIndex } = payload;
    if (fromIndex < 0 || fromIndex >= frontToBack.length) return;
    if (toIndex < 0 || toIndex >= frontToBack.length) return;

    const [dragged] = frontToBack.splice(fromIndex, 1);
    if (!dragged) return;
    frontToBack.splice(toIndex, 0, dragged);
    state.polygons = frontToBack.reverse();
  });
}

function handlePolygonListItemClick(payload: { key: string | number }) {
  const polygonId = Number(payload.key);
  if (!Number.isFinite(polygonId)) return;
  handlePolygonListClick(polygonId);
}

function asPolygonListItem(item: unknown) {
  return item as PolygonEditorPolygon;
}

function deleteSelectedPolygon() {
  if (editingLocked.value) return;
  if (!selectedPolygon.value) return;

  clearTransientInteraction();
  applyStateChange((state) => {
    const removedIndex = state.polygons.findIndex(polygon => polygon.id === selectedPolygonId.value);
    if (removedIndex === -1) return;

    state.polygons.splice(removedIndex, 1);
    const fallbackPolygon = state.polygons[removedIndex] ?? state.polygons[removedIndex - 1] ?? state.polygons[state.polygons.length - 1] ?? null;
    selectedPolygonId.value = fallbackPolygon?.id ?? null;
    selectedVertexIndex.value = null;
  });
}

function duplicateSelectedPolygon() {
  if (editingLocked.value || !selectedPolygon.value) return;

  clearTransientInteraction();
  applyStateChange((state) => {
    const polygon = selectedPolygon.value;
    if (!polygon) return;

    const duplicated = createPolygon(
      polygon.vertices.map(vertex => ({
        x: vertex.x + 0.5,
        y: vertex.y + 0.5,
      })),
      polygon.color,
    );

    const selectedIndex = state.polygons.findIndex(item => item.id === polygon.id);
    state.polygons.splice(Math.max(0, selectedIndex + 1), 0, duplicated);
    selectedPolygonId.value = duplicated.id;
    selectedVertexIndex.value = null;
  });
}

function moveSelectedPolygon(direction: -1 | 1) {
  if (editingLocked.value || !selectedPolygon.value) return;

  clearTransientInteraction();
  applyStateChange((state) => {
    const currentIndex = state.polygons.findIndex(polygon => polygon.id === selectedPolygonId.value);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.polygons.length) return;

    const [polygon] = state.polygons.splice(currentIndex, 1);
    if (!polygon) return;
    state.polygons.splice(nextIndex, 0, polygon);
    selectedPolygonId.value = polygon.id;
    selectedVertexIndex.value = null;
  });
}

function deleteSelectedVertex() {
  if (editingLocked.value || !selectedPolygon.value || selectedVertexIndex.value === null) return;

  const polygon = selectedPolygon.value;
  if (polygon.vertices.length <= 3) {
    deleteSelectedPolygon();
    return;
  }

  applyStateChange((state) => {
    const item = state.polygons.find(polygon => polygon.id === selectedPolygonId.value);
    if (!item || selectedVertexIndex.value === null) return;
    item.vertices.splice(selectedVertexIndex.value, 1);
    selectedVertexIndex.value = Math.min(selectedVertexIndex.value, item.vertices.length - 1);
  });
}

function insertVertexAtSelectedEdge() {
  if (editingLocked.value || !selectedPolygon.value) return;

  const vertexIndex = selectedVertexIndex.value ?? 0;
  applyStateChange((state) => {
    const item = state.polygons.find(polygon => polygon.id === selectedPolygonId.value);
    if (!item || item.vertices.length < 2) return;

    const nextIndex = (vertexIndex + 1) % item.vertices.length;
    const start = item.vertices[vertexIndex];
    const end = item.vertices[nextIndex];
    if (!start || !end) return;
    const midpoint = snapPoint({
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    });

    item.vertices.splice(nextIndex, 0, midpoint);
    selectedVertexIndex.value = nextIndex;
  });
}

function insertVertexAtEdge(edgeHit: HitEdge) {
  applyStateChange((state) => {
    const polygon = state.polygons.find(item => item.id === edgeHit.polygonId);
    if (!polygon) return;
    const insertIndex = (edgeHit.edgeIndex + 1) % polygon.vertices.length;
    polygon.vertices.splice(insertIndex, 0, edgeHit.point);
    selectedPolygonId.value = polygon.id;
    selectedVertexIndex.value = insertIndex;
  });
}

function updateSelectedVertexCoordinate(index: number, axis: 'x' | 'y', value: number | null) {
  if (editingLocked.value || !selectedPolygon.value) return;

  applyStateChange((state) => {
    const item = state.polygons.find(polygon => polygon.id === selectedPolygonId.value);
    if (!item || !item.vertices[index]) return;

    const nextVertex = {
      ...item.vertices[index],
      [axis]: roundCoordinate(value ?? 0),
    } satisfies PolygonEditorPoint;
    item.vertices[index] = clampToLogicalBounds(nextVertex, logicalBounds.value);
  });
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

function handleCanvasPointerDown(event: PointerEvent) {
  if (editingLocked.value) return;

  surfaceRef.value?.focus();

  const rawWorldPoint = canvasToWorldRaw(event.clientX, event.clientY);

  if (event.button === 2) {
    if (mode.value === 'drawPolygon' && draftPolygon.value) {
      finalizeDraft();
      mode.value = 'select';
      event.preventDefault();
      return;
    }

    if (mode.value === 'select') {
      const vertexHit = findHitVertex(rawWorldPoint);
      if (vertexHit && vertexHit.polygonId === selectedPolygonId.value) {
        selectPolygon(vertexHit.polygonId, vertexHit.vertexIndex);
        deleteSelectedVertex();
        event.preventDefault();
      }
    }
    return;
  }

  if (event.button !== 0) return;

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

  const edgeHit = findHitEdge(rawWorldPoint);
  if (mode.value === 'select' && edgeHit && edgeHit.polygonId === selectedPolygonId.value) {
    insertVertexAtEdge(edgeHit);
    event.preventDefault();
    return;
  }

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
      finalizeDraft();
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

  polygon.vertices[dragState.value.vertexIndex] = canvasToWorld(event.clientX, event.clientY);
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
    finalizeDraft();
    mode.value = 'select';
    return;
  }

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedPolygon.value) {
    event.preventDefault();
    if (selectedVertexIndex.value !== null) {
      deleteSelectedVertex();
    }
    else {
      deleteSelectedPolygon();
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
  <div class="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
    <div class="space-y-4 overflow-y-scroll">
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <UButton
            :label="t('select_tool')"
            icon="i-lucide-mouse-pointer-2"
            color="neutral"
            :variant="mode === 'select' ? 'solid' : 'outline'"
            :disabled="editingLocked"
            @click="activateSelectMode"
          />
          <UButton
            :label="t('polygon_tool')"
            icon="i-lucide-pencil-ruler"
            color="primary"
            :variant="mode === 'drawPolygon' ? 'solid' : 'outline'"
            :disabled="editingLocked"
            @click="activatePolygonMode"
          />
          <UButton
            :label="t('rectangle_tool')"
            icon="i-lucide-square"
            color="neutral"
            :variant="mode === 'drawRectangle' ? 'solid' : 'outline'"
            :disabled="editingLocked"
            @click="activateRectangleMode"
          />
          <UButton
            :label="t('undo')"
            icon="i-lucide-undo-2"
            color="neutral"
            variant="ghost"
            :disabled="editingLocked || !canUndo"
            @click="performUndo"
          />
          <UButton
            :label="t('redo')"
            icon="i-lucide-redo-2"
            color="neutral"
            variant="ghost"
            :disabled="editingLocked || !canRedo"
            @click="performRedo"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="t('grid_visible')">
            <USwitch
              v-model="gridEnabledProxy"
              :disabled="editingLocked"
            />
          </UFormField>

          <UFormField :label="t('minor_divisions')">
            <UInputNumber
              v-model="minorDivisionsProxy"
              :min="1"
              :step="1"
              :disabled="editingLocked"
            />
          </UFormField>

          <div class="sm:col-span-2">
            <ColorPicker
              v-model="backgroundColorProxy"
              :label="t('background_color')"
            />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ t('polygon_list') }}
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('polygon_count', { count: editorState.polygons.length }) }}
          </span>
        </div>

        <div
          v-if="!editorState.polygons.length"
          class="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          {{ t('polygon_empty') }}
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <ReorderableList
            :items="polygonsForList"
            item-key="id"
            :selected-key="selectedPolygonId"
            :disabled="editingLocked"
            :handle-aria-label="t('drag_handle')"
            @reorder="handlePolygonListReorder"
            @item-click="handlePolygonListItemClick"
          >
            <template #item="{ item }">
              <span
                class="size-3 rounded-full ring-1 ring-black/10"
                :style="{ backgroundColor: asPolygonListItem(item).color }"
              />

              <div class="min-w-0 grow">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('polygon_item_meta', { id: asPolygonListItem(item).id, count: asPolygonListItem(item).vertices.length }) }}
                </div>
              </div>
            </template>
          </ReorderableList>
        </div>
      </div>

      <div
        v-if="selectedPolygon"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ t('selected_polygon') }}
          </h3>

          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-arrow-up"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="editingLocked || selectedPolygonIndex <= 0"
              @click="moveSelectedPolygon(-1)"
            />
            <UButton
              icon="i-lucide-arrow-down"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="editingLocked || selectedPolygonIndex < 0 || selectedPolygonIndex >= editorState.polygons.length - 1"
              @click="moveSelectedPolygon(1)"
            />
          </div>
        </div>

        <div class="space-y-3">
          <ColorPicker
            v-model="selectedPolygonColorProxy"
            :label="t('polygon_color')"
          />

          <div class="flex flex-wrap gap-2">
            <UButton
              :label="t('duplicate')"
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              :disabled="editingLocked"
              @click="duplicateSelectedPolygon"
            />
            <UButton
              :label="t('delete')"
              icon="i-lucide-trash-2"
              color="error"
              variant="outline"
              :disabled="editingLocked"
              @click="deleteSelectedPolygon"
            />
            <UButton
              :label="t('add_vertex_on_edge')"
              icon="i-lucide-plus"
              color="neutral"
              variant="soft"
              :disabled="editingLocked"
              @click="insertVertexAtSelectedEdge"
            />
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-800">
            <div class="border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {{ t('vertices') }}
            </div>

            <div
              v-for="(vertex, index) in selectedPolygon.vertices"
              :key="`${selectedPolygon.id}-vertex-${index}`"
              class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 border-b border-gray-200 px-3 py-2 last:border-b-0 dark:border-gray-800"
            >
              <button
                class="rounded px-2 py-1 text-xs font-medium"
                :class="selectedVertexIndex === index ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'"
                type="button"
                @click="selectVertex(index)"
              >
                {{ index + 1 }}
              </button>

              <UInputNumber
                :model-value="vertex.x"
                :disabled="editingLocked"
                :step="0.125"
                orientation="vertical"
                size="sm"
                @update:model-value="updateSelectedVertexCoordinate(index, 'x', $event)"
              />

              <UInputNumber
                :model-value="vertex.y"
                :disabled="editingLocked"
                :step="0.125"
                orientation="vertical"
                size="sm"
                @update:model-value="updateSelectedVertexCoordinate(index, 'y', $event)"
              />

              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="editingLocked"
                @click="selectVertex(index); deleteSelectedVertex()"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="draftPolygon"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
      >
        {{ t('polygon_draw_hint') }}
      </div>

      <div
        v-if="draftRectangle"
        class="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100"
      >
        {{ t('rectangle_draw_hint') }}
      </div>
    </div>

    <div
      ref="surfaceRef"
      tabindex="0"
      class="min-h-128 rounded-xl border border-gray-200 bg-gray-50 outline-none shadow-sm dark:border-gray-800 dark:bg-gray-950"
      :class="editingLocked ? 'cursor-not-allowed' : 'cursor-crosshair'"
      :style="{ backgroundColor: editorState.backgroundColor }"
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
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "drag_handle": "Reorder",
    "select_tool": "Select",
    "polygon_tool": "Polygon",
    "rectangle_tool": "Rectangle",
    "finish_polygon_draw": "Finish Polygon",
    "start_polygon_draw": "Draw Polygon",
    "rectangle_dragging": "Dragging Rectangle",
    "add_rectangle": "Add Rectangle",
    "undo": "Undo",
    "redo": "Redo",
    "grid_visible": "Show Grid",
    "minor_divisions": "Minor Divisions",
    "background_color": "Background Color",
    "polygon_list": "Polygons",
    "polygon_count": "{count} items",
    "polygon_empty": "No polygons yet. Add a rectangle or start polygon drawing.",
    "polygon_item_meta": "ID {id} · {count} vertices",
    "selected_polygon": "Selected Polygon",
    "polygon_color": "Polygon Color",
    "duplicate": "Duplicate",
    "delete": "Delete",
    "add_vertex_on_edge": "Add Vertex On Edge",
    "vertices": "Vertices",
    "polygon_draw_hint": "Polygon drawing mode. Click to add vertices, then click the first vertex to finish. Press Esc to cancel.",
    "rectangle_draw_hint": "Rectangle drawing mode. Drag on the canvas to define opposite corners, then release to finish. Press Esc to cancel."
  },
  "ja": {
    "drag_handle": "並べ替え",
    "select_tool": "選択",
    "polygon_tool": "多角形",
    "rectangle_tool": "矩形",
    "finish_polygon_draw": "描画を終了",
    "start_polygon_draw": "多角形を描く",
    "rectangle_dragging": "矩形のドラッグ中",
    "add_rectangle": "矩形を追加",
    "undo": "Undo",
    "redo": "Redo",
    "grid_visible": "グリッド表示",
    "minor_divisions": "マイナー分割数",
    "background_color": "背景色",
    "polygon_list": "多角形一覧",
    "polygon_count": "{count} 件",
    "polygon_empty": "まだ多角形がありません。矩形を追加するか、多角形描画を開始してください。",
    "polygon_item_meta": "ID {id} ・ {count} 頂点",
    "selected_polygon": "選択中の多角形",
    "polygon_color": "多角形色",
    "duplicate": "複製",
    "delete": "削除",
    "add_vertex_on_edge": "辺上に頂点追加",
    "vertices": "頂点",
    "polygon_draw_hint": "多角形描画中です。キャンバスをクリックして頂点を追加し、最初の頂点をクリックすると確定します。Esc でキャンセルできます。",
    "rectangle_draw_hint": "矩形をドラッグ中です。キャンバスを押したまま対角へ移動し、離すと確定します。Esc でキャンセルできます。"
  }
}
</i18n>
