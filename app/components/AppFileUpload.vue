<script setup lang="ts" generic="M extends boolean = false">
import type { FileUploadProps } from '@nuxt/ui';

const model = defineModel<(M extends true ? File[] : File) | null | undefined>();

const props = defineProps<{
  label?: string;
  description?: string;
  color?: FileUploadProps['color'];
  variant?: FileUploadProps['variant'];
  size?: FileUploadProps['size'];
  layout?: FileUploadProps['layout'];
  position?: FileUploadProps['position'];
  accept?: string;
  multiple?: M;
  disabled?: boolean;
  preview?: boolean;
  ui?: FileUploadProps['ui'];
  fullscreenDrop?: boolean;
}>();

const { t } = useI18n({ useScope: 'local' });

const dragging = ref(false);
let dragCounter = 0;

function isFileDrag(e: DragEvent) {
  return e.dataTransfer?.types.includes('Files') ?? false;
}

function dragEnter(e: DragEvent) {
  if (!props.fullscreenDrop || !isFileDrag(e)) return;

  e.preventDefault();
  dragCounter++;

  dragging.value = true;
}

function dragLeave(e: DragEvent) {
  if (!props.fullscreenDrop) return;

  e.preventDefault();

  dragCounter--;

  if (dragCounter <= 0) {
    dragCounter = 0;
    dragging.value = false;
  }
}

function dragOver(e: DragEvent) {
  if (!props.fullscreenDrop || !isFileDrag(e)) return;

  e.preventDefault();
}

function drop(e: DragEvent) {
  if (!props.fullscreenDrop || !isFileDrag(e)) return;

  e.preventDefault();

  dragging.value = false;
  dragCounter = 0;

  const dropped = [...(e.dataTransfer?.files ?? [])];

  if (!dropped.length) return;

  if (props.multiple !== undefined) {
    model.value = dropped as typeof model.value;
  } else {
    model.value = dropped[0] as typeof model.value;
  }
}

onMounted(() => {
  if (!props.fullscreenDrop) return;

  window.addEventListener('dragenter', dragEnter);
  window.addEventListener('dragleave', dragLeave);
  window.addEventListener('dragover', dragOver);
  window.addEventListener('drop', drop);
});

onBeforeUnmount(() => {
  if (!props.fullscreenDrop) return;

  window.removeEventListener('dragenter', dragEnter);
  window.removeEventListener('dragleave', dragLeave);
  window.removeEventListener('dragover', dragOver);
  window.removeEventListener('drop', drop);
});
</script>

<template>
  <UFileUpload
    v-model="model"
    :label="props.label"
    :description="props.description"
    :color="props.color"
    :variant="props.variant"
    :size="props.size"
    :layout="props.layout"
    :position="props.position"
    :accept="props.accept"
    :multiple="props.multiple"
    :disabled="props.disabled"
    :preview="props.preview"
    :ui="props.ui"
  />

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-98"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-98"
    >
      <div
        v-if="fullscreenDrop && dragging"
        class="bg-default/70 fixed inset-0 z-9999 backdrop-blur-sm"
      >
        <div class="flex h-full items-center justify-center p-8">
          <div
            class="border-primary bg-default flex w-full max-w-lg flex-col items-center rounded-xl border-2 border-dashed px-12 py-16 shadow-xl"
          >
            <UIcon name="i-lucide-upload" class="text-primary mb-6 size-12" />

            <p class="text-lg font-semibold">
              {{ t('fileUpload.dropTitle') }}
            </p>

            <p class="text-muted mt-2 text-center text-sm">
              {{ t('fileUpload.dropDescription') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<i18n lang="json">
{
  "en": {
    "fileUpload": {
      "dropTitle": "Drop files to upload",
      "dropDescription": "Release your files anywhere to upload them."
    }
  },
  "ja": {
    "fileUpload": {
      "dropTitle": "ファイルをドロップ",
      "dropDescription": "ここにドロップするとアップロードできます"
    }
  }
}
</i18n>
