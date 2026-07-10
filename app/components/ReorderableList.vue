<script setup lang="ts">
import { ref } from 'vue';

type ItemKey = string | number;

type ReorderPayload = {
  fromIndex: number;
  toIndex: number;
};

type ItemClickPayload = {
  key: ItemKey;
  index: number;
};

const props = withDefaults(defineProps<{
  items: unknown[];
  itemKey?: string;
  disabled?: boolean;
  selectedKey?: ItemKey | null;
  handleAriaLabel?: string;
  containerClass?: string;
  rowClass?: string;
  selectedRowClass?: string;
  defaultRowClass?: string;
}>(), {
  itemKey: '',
  disabled: false,
  selectedKey: null,
  handleAriaLabel: 'Reorder',
  containerClass: 'space-y-2',
  rowClass: 'relative flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition',
  selectedRowClass: 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30',
  defaultRowClass: 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800',
});

const emit = defineEmits<{
  (event: 'reorder', payload: ReorderPayload): void;
  (event: 'itemClick', payload: ItemClickPayload): void;
}>();

const draggingFromIndex = ref<number | null>(null);
const dragInsertIndex = ref<number | null>(null);

function toItemKey(value: unknown, fallback: number): ItemKey {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return fallback;
}

function getItemKey(item: unknown, index: number): ItemKey {
  if (!props.itemKey) {
    return index;
  }

  if (item && typeof item === 'object' && props.itemKey in item) {
    const record = item as Record<string, unknown>;
    return toItemKey(record[props.itemKey], index);
  }

  return index;
}

function clearDragState() {
  draggingFromIndex.value = null;
  dragInsertIndex.value = null;
}

function handleDragStart(event: DragEvent, index: number) {
  if (props.disabled) return;
  draggingFromIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function handleRowDragOver(event: DragEvent, index: number) {
  if (props.disabled || draggingFromIndex.value === null) return;
  event.preventDefault();

  const target = event.currentTarget as HTMLElement | null;
  const rect = target?.getBoundingClientRect();
  const isAfter = rect ? (event.clientY - rect.top) >= rect.height / 2 : false;
  const candidate = index + (isAfter ? 1 : 0);
  dragInsertIndex.value = Math.max(0, Math.min(candidate, props.items.length));

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleListDragOver(event: DragEvent) {
  if (props.disabled || draggingFromIndex.value === null) return;
  event.preventDefault();

  const container = event.currentTarget as HTMLElement | null;
  const pointerY = event.clientY;
  const rowElements = container
    ? Array.from(container.querySelectorAll<HTMLElement>('[data-reorder-row="true"]'))
    : [];

  let nextInsertIndex = rowElements.length;
  for (let index = 0; index < rowElements.length; index += 1) {
    const row = rowElements[index];
    if (!row) continue;
    const rect = row.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    if (pointerY < centerY) {
      nextInsertIndex = index;
      break;
    }
  }

  dragInsertIndex.value = nextInsertIndex;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function finalizeDrop() {
  const fromIndex = draggingFromIndex.value;
  const insertIndex = dragInsertIndex.value;

  if (fromIndex === null || insertIndex === null) {
    clearDragState();
    return;
  }

  const toIndex = fromIndex < insertIndex ? insertIndex - 1 : insertIndex;
  const clampedToIndex = Math.max(0, Math.min(toIndex, props.items.length - 1));

  if (fromIndex !== clampedToIndex) {
    emit('reorder', {
      fromIndex,
      toIndex: clampedToIndex,
    });
  }

  clearDragState();
}

function handleRowDrop(event: DragEvent, index: number) {
  if (props.disabled) return;
  event.preventDefault();
  event.stopPropagation();

  if (dragInsertIndex.value === null) {
    dragInsertIndex.value = index;
  }

  finalizeDrop();
}

function handleListDrop(event: DragEvent) {
  if (props.disabled) return;
  event.preventDefault();

  if (dragInsertIndex.value === null) {
    dragInsertIndex.value = props.items.length;
  }

  finalizeDrop();
}

function showDragInsertLine(index: number) {
  return dragInsertIndex.value !== null
    && draggingFromIndex.value !== null
    && dragInsertIndex.value === index;
}

function handleItemClick(item: unknown, index: number) {
  emit('itemClick', {
    key: getItemKey(item, index),
    index,
  });
}
</script>

<template>
  <div
    :class="containerClass"
    @dragover="handleListDragOver"
    @drop="handleListDrop"
  >
    <div
      v-if="showDragInsertLine(0)"
      class="pointer-events-none h-0 relative"
    >
      <span class="absolute inset-x-0 -top-1 h-0.5 rounded-full bg-primary-500" />
    </div>

    <template
      v-for="(item, index) in items"
      :key="getItemKey(item, index)"
    >
      <button
        :class="[
          rowClass,
          getItemKey(item, index) === selectedKey ? selectedRowClass : defaultRowClass,
        ]"
        data-reorder-row="true"
        type="button"
        @click="handleItemClick(item, index)"
        @dragover.stop="handleRowDragOver($event, index)"
        @drop.stop="handleRowDrop($event, index)"
      >
        <span
          class="cursor-grab rounded p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-200"
          :aria-label="handleAriaLabel"
          draggable="true"
          role="button"
          @click.stop
          @dragstart="handleDragStart($event, index)"
          @dragend="clearDragState"
        >
          <slot name="handle">
            <UIcon
              name="i-lucide-grip-vertical"
              class="block size-5"
            />
          </slot>
        </span>

        <slot
          name="item"
          :item="item"
          :index="index"
          :key-value="getItemKey(item, index)"
        />

        <span
          v-if="showDragInsertLine(index + 1)"
          class="pointer-events-none absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary-500"
        />
      </button>
    </template>
  </div>
</template>
