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

const dragging = useFullscreenDrop(
  () => props.fullscreenDrop,
  (files) => {
    if (props.multiple !== undefined) {
      model.value = files as typeof model.value;
    } else {
      model.value = files[0] as typeof model.value;
    }
  },
);
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

  <FullscreenDropOverlay :show="fullscreenDrop && dragging" />
</template>
