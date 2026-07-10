<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useManualRefHistory, useResizeObserver } from '@vueuse/core';

export interface PolygonEditorPoint {
  x: number;
  y: number;
}

export interface PolygonEditorPolygon {
  id: number;
  color: string;
  vertices: PolygonEditorPoint[];
}

export interface PolygonEditorGrid {
  enabled: boolean;
  minorDivisions: number;
}

export interface PolygonEditorValue {
  backgroundColor: string;
  grid: PolygonEditorGrid;
  polygons: PolygonEditorPolygon[];
}

type DraftRectangle = {
  start: PolygonEditorPoint;
  current: PolygonEditorPoint;
  color: string;
};

type CanvasMetrics = {
  width: number;
  height: number;
  dpr: number;
  originX: number;
  originY: number;
};

type HitVertex = {
  polygonId: number;
  vertexIndex: number;
  distance: number;
};

type HitEdge = {
  polygonId: number;
  edgeIndex: number;
  point: PolygonEditorPoint;
  distance: number;
};

type ViewTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
  logicalWidth: number;
  logicalHeight: number;
};

const DEFAULT_BACKGROUND_COLOR = '#F8FAFC';
const DEFAULT_POLYGON_COLOR = '#2563EB';
const GRID_SCALE = 56;
const HANDLE_HIT_THRESHOLD_PX = 14;
const SNAP_PRECISION = 1_000_000;

const POLYGON_COLORS = [
  '#0F766E',
  '#1D4ED8',
  '#7C3AED',
  '#B45309',
  '#DC2626',
  '#059669',
  '#C026D3',
  '#0284C7',
];

let nextPolygonColorIndex = 0;

function getNextPolygonColor() {
  const color = POLYGON_COLORS[nextPolygonColorIndex % POLYGON_COLORS.length]!;
  nextPolygonColorIndex += 1;
  return color;
}

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
const draggingPolygonId = ref<number | null>(null);
const dragInsertIndex = ref<number | null>(null);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampToLogicalBounds(point: PolygonEditorPoint): PolygonEditorPoint {
  return {
    x: clamp(point.x, logicalBounds.value.minX, logicalBounds.value.maxX),
    y: clamp(point.y, logicalBounds.value.minY, logicalBounds.value.maxY),
  };
}

function clampVerticesToLogicalBounds(vertices: PolygonEditorPoint[]) {
  return vertices.map(vertex => clampToLogicalBounds(vertex));
}

function isWithinLogicalBounds(point: PolygonEditorPoint) {
  return point.x >= logicalBounds.value.minX
    && point.x <= logicalBounds.value.maxX
    && point.y >= logicalBounds.value.minY
    && point.y <= logicalBounds.value.maxY;
}

function clonePoint(point: PolygonEditorPoint): PolygonEditorPoint {
  return {
    x: point.x,
    y: point.y,
  };
}

function clonePolygon(polygon: PolygonEditorPolygon): PolygonEditorPolygon {
  return {
    id: polygon.id,
    color: polygon.color,
    vertices: polygon.vertices.map(clonePoint),
  };
}

function clonePolygonEditorValue(value: PolygonEditorValue): PolygonEditorValue {
  return {
    backgroundColor: value.backgroundColor,
    grid: {
      enabled: value.grid.enabled,
      minorDivisions: value.grid.minorDivisions,
    },
    polygons: value.polygons.map(clonePolygon),
  };
}

function createDefaultPolygonEditorValue(): PolygonEditorValue {
  return {
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    grid: {
      enabled: true,
      minorDivisions: 4,
    },
    polygons: [],
  };
}

function getViewTransform(metrics: CanvasMetrics): ViewTransform {
  const logicalWidth = Math.max(0.000001, logicalBounds.value.maxX - logicalBounds.value.minX);
  const logicalHeight = Math.max(0.000001, logicalBounds.value.maxY - logicalBounds.value.minY);
  const scale = Math.min(metrics.width / logicalWidth, metrics.height / logicalHeight);
  const offsetX = (metrics.width - logicalWidth * scale) / 2 - logicalBounds.value.minX * scale;
  const offsetY = metrics.height - (metrics.height - logicalHeight * scale) / 2 + logicalBounds.value.minY * scale;
  return {
    scale,
    offsetX,
    offsetY,
    logicalWidth,
    logicalHeight,
  };
}

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
    vertices: clampVerticesToLogicalBounds(vertices.map(clonePoint)),
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
  const clampedStart = clampToLogicalBounds(start);
  const clampedEnd = clampToLogicalBounds(end);
  const minX = Math.min(clampedStart.x, clampedEnd.x);
  const maxX = Math.max(clampedStart.x, clampedEnd.x);
  const minY = Math.min(clampedStart.y, clampedEnd.y);
  const maxY = Math.max(clampedStart.y, clampedEnd.y);

  return createPolygon([
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ], color);
}

function roundCoordinate(value: number) {
  return Math.round(value * SNAP_PRECISION) / SNAP_PRECISION;
}

function snapPoint(point: PolygonEditorPoint) {
  if (!editorState.value.grid.enabled) {
    return clampToLogicalBounds({
      x: roundCoordinate(point.x),
      y: roundCoordinate(point.y),
    });
  }

  const step = 1 / Math.max(1, editorState.value.grid.minorDivisions);
  return clampToLogicalBounds({
    x: roundCoordinate(Math.round(point.x / step) * step),
    y: roundCoordinate(Math.round(point.y / step) * step),
  });
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

  const transform = getViewTransform(metrics);
  const x = (clientX - rect.left - transform.offsetX) / transform.scale;
  const y = (transform.offsetY - (clientY - rect.top)) / transform.scale;
  return { x, y };
}

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

function handlePolygonDragStart(event: DragEvent, polygonId: number) {
  if (editingLocked.value) return;
  draggingPolygonId.value = polygonId;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(polygonId));
  }
}

function handlePolygonDragOver(event: DragEvent, polygonId: number) {
  if (editingLocked.value || draggingPolygonId.value === null) return;
  event.preventDefault();

  const list = polygonsForList.value;
  const overIndex = list.findIndex(polygon => polygon.id === polygonId);
  if (overIndex === -1) return;

  const target = event.currentTarget as HTMLElement | null;
  const rect = target?.getBoundingClientRect();
  const isAfter = rect ? (event.clientY - rect.top) >= rect.height / 2 : false;
  const candidate = overIndex + (isAfter ? 1 : 0);
  dragInsertIndex.value = Math.max(0, Math.min(candidate, list.length));

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handlePolygonListDragOver(event: DragEvent) {
  if (editingLocked.value || draggingPolygonId.value === null) return;
  event.preventDefault();
  dragInsertIndex.value = polygonsForList.value.length;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function updatePolygonOrderByDragInsert() {
  const draggedId = draggingPolygonId.value;
  const insertIndex = dragInsertIndex.value;
  if (draggedId === null || insertIndex === null) return;

  applyStateChange((state) => {
    const frontToBack = [...state.polygons].reverse();
    const fromIndex = frontToBack.findIndex(polygon => polygon.id === draggedId);
    if (fromIndex === -1) return;

    const [dragged] = frontToBack.splice(fromIndex, 1);
    if (!dragged) return;

    const normalizedInsertIndex = fromIndex < insertIndex ? insertIndex - 1 : insertIndex;
    const clampedInsertIndex = Math.max(0, Math.min(normalizedInsertIndex, frontToBack.length));
    frontToBack.splice(clampedInsertIndex, 0, dragged);
    state.polygons = frontToBack.reverse();
  });
}

function showDragInsertLine(index: number) {
  return dragInsertIndex.value !== null
    && draggingPolygonId.value !== null
    && dragInsertIndex.value === index;
}

function clearDragState() {
  draggingPolygonId.value = null;
  dragInsertIndex.value = null;
}

function handlePolygonDrop(event: DragEvent, targetPolygonId: number) {
  if (editingLocked.value) return;
  event.preventDefault();
  event.stopPropagation();

  if (dragInsertIndex.value === null) {
    const list = polygonsForList.value;
    const overIndex = list.findIndex(polygon => polygon.id === targetPolygonId);
    if (overIndex !== -1) {
      dragInsertIndex.value = overIndex;
    }
  }

  updatePolygonOrderByDragInsert();
  clearDragState();
}

function handlePolygonListDrop(event: DragEvent) {
  if (editingLocked.value) return;
  event.preventDefault();

  if (dragInsertIndex.value === null) {
    dragInsertIndex.value = polygonsForList.value.length;
  }

  updatePolygonOrderByDragInsert();
  clearDragState();
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
    item.vertices[index] = clampToLogicalBounds(nextVertex);
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
  const transform = getViewTransform(metrics);
  return {
    x: transform.offsetX + point.x * transform.scale,
    y: transform.offsetY - point.y * transform.scale,
  };
}

function canvasToWorld(clientX: number, clientY: number) {
  return snapPoint(canvasToWorldRaw(clientX, clientY));
}

function distanceToSegment(point: PolygonEditorPoint, start: PolygonEditorPoint, end: PolygonEditorPoint) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return {
      distance: Math.hypot(dx, dy),
      point: clonePoint(start),
    };
  }

  const rawT = ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projected = {
    x: start.x + t * deltaX,
    y: start.y + t * deltaY,
  };
  return {
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
    point: projected,
  };
}

function pointInPolygon(point: PolygonEditorPoint, vertices: PolygonEditorPoint[]) {
  if (vertices.length < 3) return false;

  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const current = vertices[index];
    const previousVertex = vertices[previous];
    if (!current || !previousVertex) continue;
    const intersects = ((current.y > point.y) !== (previousVertex.y > point.y))
      && (point.x < ((previousVertex.x - current.x) * (point.y - current.y)) / ((previousVertex.y - current.y) || 1e-12) + current.x);
    if (intersects) inside = !inside;
  }

  return inside;
}

function findHitVertex(point: PolygonEditorPoint) {
  const threshold = HANDLE_HIT_THRESHOLD_PX / GRID_SCALE;
  for (let polygonIndex = editorState.value.polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = editorState.value.polygons[polygonIndex];
    if (!polygon) continue;
    for (let vertexIndex = 0; vertexIndex < polygon.vertices.length; vertexIndex += 1) {
      const vertex = polygon.vertices[vertexIndex];
      if (!vertex) continue;
      const distance = Math.hypot(point.x - vertex.x, point.y - vertex.y);
      if (distance <= threshold) {
        return {
          polygonId: polygon.id,
          vertexIndex,
          distance,
        } satisfies HitVertex;
      }
    }
  }

  return null;
}

function findHitEdge(point: PolygonEditorPoint) {
  const threshold = HANDLE_HIT_THRESHOLD_PX / GRID_SCALE;

  for (let polygonIndex = editorState.value.polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = editorState.value.polygons[polygonIndex];
    if (!polygon) continue;
    if (polygon.vertices.length < 2) continue;

    for (let edgeIndex = 0; edgeIndex < polygon.vertices.length; edgeIndex += 1) {
      const start = polygon.vertices[edgeIndex];
      const end = polygon.vertices[(edgeIndex + 1) % polygon.vertices.length];
      if (!start || !end) continue;
      const result = distanceToSegment(point, start, end);
      if (result.distance <= threshold) {
        return {
          polygonId: polygon.id,
          edgeIndex,
          point: snapPoint(result.point),
          distance: result.distance,
        } satisfies HitEdge;
      }
    }
  }

  return null;
}

function findHitPolygon(point: PolygonEditorPoint) {
  for (let polygonIndex = editorState.value.polygons.length - 1; polygonIndex >= 0; polygonIndex -= 1) {
    const polygon = editorState.value.polygons[polygonIndex];
    if (!polygon) continue;
    if (pointInPolygon(point, polygon.vertices)) {
      return polygon;
    }
  }

  return null;
}

function renderGrid(ctx: CanvasRenderingContext2D, metrics: CanvasMetrics) {
  if (!editorState.value.grid.enabled) return;

  const minorDivisions = Math.max(1, editorState.value.grid.minorDivisions);
  const transform = getViewTransform(metrics);
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
  options: {
    selected?: boolean;
    draft?: boolean;
    dimmed?: boolean;
    drawStroke?: boolean;
    drawVertices?: boolean;
  } = {},
) {
  const selected = options.selected ?? false;
  const draft = options.draft ?? false;
  const dimmed = options.dimmed ?? false;
  const drawStroke = options.drawStroke ?? (draft || selected);
  const drawVertices = options.drawVertices ?? (draft || selected);
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

  if (polygon.vertices.length >= 3) {
    let fillAlpha = draft ? 0.45 : 1;
    if (dimmed) {
      fillAlpha = Math.min(fillAlpha, 0.84);
    }
    ctx.globalAlpha = fillAlpha;
    ctx.fillStyle = polygon.color;
    ctx.fill();
  }

  if (draft && drawStroke) {
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = polygon.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (selected && !draft && drawStroke) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = polygon.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  if (drawVertices && (selected || draft)) {
    polygon.vertices.forEach((vertex, index) => {
      const canvasPoint = worldToCanvas(vertex, metrics);
      const isSelectedVertex = selected && selectedPolygonId.value === polygon.id && selectedVertexIndex.value === index;

      if (isSelectedVertex) {
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
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
        ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = polygon.color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
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
      selected: polygon.id === selectedPolygonId.value,
      draft: false,
      dimmed: hasSelectedPolygon,
      drawStroke: false,
      drawVertices: false,
    });
  }

  if (selectedPolygonItem) {
    renderPolygon(ctx, metrics, selectedPolygonItem, {
      selected: true,
      draft: false,
      dimmed: false,
      drawStroke: true,
      drawVertices: true,
    });
  }

  if (draftPolygon.value) {
    renderPolygon(ctx, metrics, draftPolygon.value, {
      selected: true,
      draft: true,
      dimmed: false,
    });
  }

  if (draftRectangle.value) {
    const { start, current } = draftRectangle.value;
    const polygon = createRectanglePolygon(start, current, draftRectangle.value.color);
    renderPolygon(ctx, metrics, polygon, {
      selected: true,
      draft: true,
      dimmed: false,
    });
  }
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

  if (!isWithinLogicalBounds(rawWorldPoint)) {
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
    draftRectangle.value.current = clampToLogicalBounds(canvasToWorld(event.clientX, event.clientY));
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
    draftRectangle.value.current = clampToLogicalBounds(canvasToWorld(event.clientX, event.clientY));
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
          @dragover="handlePolygonListDragOver"
          @drop="handlePolygonListDrop"
        >
          <div
            v-if="showDragInsertLine(0)"
            class="pointer-events-none h-0 relative"
          >
            <span class="absolute inset-x-0 -top-1 h-0.5 rounded-full bg-primary-500" />
          </div>

          <template
            v-for="(polygon, index) in polygonsForList"
            :key="polygon.id"
          >
            <button
              class="relative flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition"
              :class="[
                polygon.id === selectedPolygonId
                  ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800',
              ]"
              type="button"
              @click="handlePolygonListClick(polygon.id)"
              @dragover.stop="handlePolygonDragOver($event, polygon.id)"
              @drop.stop="handlePolygonDrop($event, polygon.id)"
            >
              <span
                class="cursor-grab rounded p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-200"
                :aria-label="t('drag_handle')"
                draggable="true"
                role="button"
                @click.stop
                @dragstart="handlePolygonDragStart($event, polygon.id)"
                @dragend="clearDragState"
              >
                <UIcon
                  name="i-lucide-grip-vertical"
                  class="size-5 block"
                />
              </span>

              <span
                class="size-3 rounded-full ring-1 ring-black/10"
                :style="{ backgroundColor: polygon.color }"
              />

              <div class="min-w-0 grow">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('polygon_item_meta', { id: polygon.id, count: polygon.vertices.length }) }}
                </div>
              </div>

              <span
                v-if="showDragInsertLine(index + 1)"
                class="pointer-events-none absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary-500"
              />
            </button>
          </template>
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
