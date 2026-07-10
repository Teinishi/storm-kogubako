<script setup lang="ts">
import { usePolygonEditorContext } from '~/composables/useEditorContext';

const { t } = useI18n({ useScope: 'local' });

const {
  editorState,
  mode,
  draftPolygon,
  draftRectangle,
  selectedPolygonId,
  selectedVertexIndex,
  selectedPolygonIndex,
  selectedPolygon,
  editingLocked,
  activateSelectMode,
  activatePolygonMode,
  activateRectangleMode,
  canUndo,
  canRedo,
  gridEnabled,
  minorDivisions,
  backgroundColor,
  performUndo,
  performRedo,
  selectPolygon,
  selectVertex,
  clearSelection,
  duplicatePolygon,
  deletePolygon,
  deleteVertex,
  insertMidpoint,
  updateVertexCoordinate,
  clearTransientInteraction,
  applyStateChange,
} = usePolygonEditorContext();

const polygonsForList = computed(() => [...editorState.value.polygons].reverse());

const selectedPolygonColorProxy = computed({
  get: () => selectedPolygon.value?.color,
  set: (value: string) => {
    if (!selectedPolygon.value) return;
    applyStateChange((state) => {
      const polygon = state.polygons.find(item => item.id === selectedPolygonId.value);
      if (!polygon) return;
      polygon.color = value;
    });
  },
});

function handleReorder(value: { fromIndex: number; toIndex: number }) {
  clearTransientInteraction();
  applyStateChange((state) => {
    const len = state.polygons.length;
    const fromIndex = len - value.fromIndex - 1;
    const toIndex = len - value.toIndex - 1;
    if (fromIndex < 0 || len <= fromIndex) return;
    if (toIndex < 0 || len <= toIndex) return;

    const polygons = [...state.polygons];
    const [item] = polygons.splice(fromIndex, 1);
    if (!item) return;
    polygons.splice(toIndex, 0, item);
    state.polygons = polygons;
  });
}

function handleListItemClick(payload: { key: string | number }) {
  const polygonId = Number(payload.key);
  if (!Number.isFinite(polygonId)) return;

  if (selectedPolygonId.value === polygonId) {
    clearSelection();
  }
  else {
    selectPolygon(polygonId, null);
  }
}

function moveSelectedPolygon(direction: number) {
  const i = selectedPolygonIndex.value;
  handleReorder({
    fromIndex: i,
    toIndex: i + direction,
  });
}

function duplicateSelectedPolygon() {
  const id = selectedPolygonId.value;
  if (id === null) return;
  duplicatePolygon(id);
}

function deleteSelectedPolygon() {
  const id = selectedPolygonId.value;
  if (id === null) return;
  deletePolygon(id);
}

function deleteSelectedVertex() {
  const polygonId = selectedPolygonId.value;
  if (polygonId === null) return;
  const vertexIndex = selectedVertexIndex.value;
  if (vertexIndex === null) return;

  deleteVertex(polygonId, vertexIndex);
}

function insertVertexAtSelectedEdge() {
  const polygonId = selectedPolygonId.value;
  if (polygonId === null) return;
  const vertexIndex = selectedVertexIndex.value;
  if (vertexIndex === null) return;

  insertMidpoint(polygonId, vertexIndex);
}

function updateSelectedVertexCoordinate(index: number, axis: 'x' | 'y', value: number | null) {
  const id = selectedPolygonId.value;
  if (id === null) return;
  updateVertexCoordinate(id, index, { [axis]: value });
}
</script>

<template>
  <div class="space-y-4">
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
            v-model="gridEnabled"
            :disabled="editingLocked"
          />
        </UFormField>

        <UFormField :label="t('minor_divisions')">
          <UInputNumber
            v-model="minorDivisions"
            :min="1"
            :step="1"
            :disabled="editingLocked"
          />
        </UFormField>

        <div class="sm:col-span-2">
          <ColorPicker
            v-model="backgroundColor"
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
          @reorder="handleReorder"
          @item-click="handleListItemClick"
        >
          <template #item="{ item }">
            <span
              class="size-3 rounded-full ring-1 ring-black/10"
              :style="{ backgroundColor: item.color }"
            />

            <div class="min-w-0 grow">
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('polygon_item_meta', { id: item.id, count: item.vertices.length }) }}
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
          v-if="selectedPolygonColorProxy !== undefined"
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
