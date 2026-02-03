<script setup lang="ts">
import { round } from '~/utils/utils';

export type ResizeSettings = {
  sizeType: 'block' | 'pixel' | 'percent';
  keepAspect: boolean;
  sizePriority: 'width' | 'height';
  widthPixels: number;
  heightPixels: number;
  resizeAlgo: 'pixelated' | 'smooth';
};

const { t } = useI18n({
  useScope: 'local',
});

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  roundDigit: {
    type: Number,
    default: 3,
  },
  imageSize: {
    type: Object as () => { width: number; height: number },
    required: true,
  },
  sizeBlocks: {
    type: Object as () => { width: number; height: number },
  },
});
const modelValue = defineModel<ResizeSettings>({ required: true });

const sizeUnitLabel = computed(() => t(`size_type_unit_${modelValue.value.sizeType}`));

const widthBlocks = computed(() => Math.ceil(modelValue.value.widthPixels / 9));
const heightBlocks = computed(() => Math.ceil(modelValue.value.heightPixels / 9));
const widthPercent = computed(() => round(modelValue.value.widthPixels / props.imageSize.width, 3));
const heightPercent = computed(() => round(modelValue.value.heightPixels / props.imageSize.height, 3));

const updateWidthPixels = (value: number | null) => {
  if (value !== null) {
    modelValue.value.sizePriority = 'width';
    modelValue.value.widthPixels = value;
    if (modelValue.value.keepAspect && props.imageSize) {
      modelValue.value.heightPixels = round(value * props.imageSize.height / props.imageSize.width, 3);
    }
  }
};
const updateHeightPixels = (value: number | null) => {
  if (value !== null) {
    modelValue.value.sizePriority = 'height';
    modelValue.value.heightPixels = value;
    if (modelValue.value.keepAspect && props.imageSize) {
      modelValue.value.widthPixels = round(value * props.imageSize.width / props.imageSize.height, 3);
    }
  }
};

const updateWidthBlocks = (value: number | null) => {
  if (value !== null) {
    updateWidthPixels(value * 9);
  }
};
const updateHeightBlocks = (value: number | null) => {
  if (value !== null) {
    updateHeightPixels(value * 9);
  }
};

const updateWidthPercent = (value: number | null) => {
  if (value !== null) {
    updateWidthPixels(value * props.imageSize.width);
  }
};
const updateHeightPercent = (value: number | null) => {
  if (value !== null) {
    updateHeightPixels(value * props.imageSize.height);
  }
};

const isOriginalSize = computed(() => {
  if (!props.imageSize) return false;
  return props.imageSize.width === modelValue.value.widthPixels && props.imageSize.height === modelValue.value.heightPixels;
});
const setSizeOriginal = () => {
  if (!props.imageSize) return;
  modelValue.value.widthPixels = props.imageSize.width;
  modelValue.value.heightPixels = props.imageSize.height;
};

watch(modelValue, (newValue, oldValue) => {
  if (newValue.sizeType === oldValue.sizeType && newValue.sizePriority === oldValue.sizePriority) return;
  if (modelValue.value.sizeType === 'block') {
    if (modelValue.value.sizePriority === 'width') {
      updateWidthBlocks(widthBlocks.value);
    }
    else {
      updateHeightBlocks(heightBlocks.value);
    }
  }
  else {
    if (modelValue.value.sizePriority === 'width') {
      updateWidthPixels(modelValue.value.widthPixels);
    }
    else {
      updateHeightPixels(modelValue.value.heightPixels);
    }
  }
}, { deep: true });
</script>

<template>
  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
    <h2 class="font-bold text-lg">
      {{ props.label }}
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <div class="space-y-4">
        <UFormField :label="t('size_type')">
          <USelect
            v-model="modelValue.sizeType"
            :items="[
              { value: 'block', label: t('size_type_block') },
              { value: 'pixel', label: t('size_type_pixel') },
              { value: 'percent', label: t('size_type_percent') },
            ]"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="modelValue.keepAspect"
          :label="t('keep_aspect')"
        />
      </div>

      <div class="row-span-2 h-full flex flex-col gap-4 justify-between">
        <UFormField :label="`${t('width')} (${sizeUnitLabel})`">
          <UInputNumber
            v-if="modelValue.sizeType === 'block'"
            :model-value="widthBlocks"
            :min="1"
            @update:model-value="updateWidthBlocks"
          />
          <UInputNumber
            v-else-if="modelValue.sizeType === 'pixel'"
            :model-value="modelValue.widthPixels"
            :min="1"
            @update:model-value="updateWidthPixels"
          />
          <UInputNumber
            v-else
            :model-value="widthPercent"
            :min="0.01"
            :step="0.01"
            :format-options="{ style: 'percent' }"
            @update:model-value="updateWidthPercent"
          />
        </UFormField>

        <UFormField :label="`${t('height')} (${sizeUnitLabel})`">
          <UInputNumber
            v-if="modelValue.sizeType === 'block'"
            :model-value="heightBlocks"
            :min="1"
            @update:model-value="updateHeightBlocks"
          />
          <UInputNumber
            v-else-if="modelValue.sizeType === 'pixel'"
            :model-value="modelValue.heightPixels"
            :min="1"
            @update:model-value="updateHeightPixels"
          />
          <UInputNumber
            v-else
            :model-value="heightPercent"
            :min="0.01"
            :step="0.01"
            :format-options="{ style: 'percent' }"
            @update:model-value="updateHeightPercent"
          />
        </UFormField>

        <div
          class="grid grid-cols-2 text-xs bg-gray-200 dark:bg-gray-700 rounded p-1"
          :style="{ visibility: modelValue.keepAspect ? 'visible' : 'hidden' }"
        >
          <button
            :class="{ 'bg-white dark:bg-gray-600 shadow': modelValue.sizePriority === 'width' }"
            class="px-2 py-1 rounded transition"
            @click="modelValue.sizePriority = 'width'"
          >
            {{ t('prioritize_width') }}
          </button>
          <button
            :class="{ 'bg-white dark:bg-gray-600 shadow': modelValue.sizePriority === 'height' }"
            class="px-2 py-1 rounded transition"
            @click="modelValue.sizePriority = 'height'"
          >
            {{ t('prioritize_height') }}
          </button>
        </div>
      </div>

      <div class="self-end space-y-4">
        <UButton
          v-if="props.imageSize"
          :disabled="isOriginalSize"
          :color="isOriginalSize ? 'neutral' : 'primary'"
          :label="t('reset_to_original_size')"
          variant="subtle"
          class="w-full justify-center"
          @click="setSizeOriginal"
        />

        <UFormField :label="t('resize_algo')">
          <USelect
            v-model="modelValue.resizeAlgo"
            :items="[
              { label: t('resize_smooth'), value: 'smooth' },
              { label: t('resize_pixelated'), value: 'pixelated' },
            ]"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "size_type": "Method",
    "size_type_block": "Blocks",
    "size_type_pixel": "Pixels",
    "size_type_percent": "Scale",
    "size_type_unit_block": "Blocks",
    "size_type_unit_pixel": "px",
    "size_type_unit_percent": "%",
    "keep_aspect": "Keep aspect ratio",
    "width": "Width",
    "height": "Height",
    "prioritize_width": "Prioritize Width",
    "prioritize_height": "Prioritize Height",
    "reset_to_original_size": "Reset to Original Size",
    "resize_algo": "Resize Algorithm",
    "resize_smooth": "Smooth",
    "resize_pixelated": "Pixelated"
  },
  "ja": {
    "size_type": "指定方法",
    "size_type_block": "ブロック数",
    "size_type_pixel": "ピクセル数",
    "size_type_percent": "拡大率",
    "size_type_unit_block": "ブロック",
    "size_type_unit_pixel": "px",
    "size_type_unit_percent": "%",
    "keep_aspect": "縦横比を維持",
    "width": "幅",
    "height": "高さ",
    "prioritize_width": "幅優先",
    "prioritize_height": "高さ優先",
    "reset_to_original_size": "元画像に合わせる",
    "resize_algo": "リサイズ処理",
    "resize_smooth": "滑らか",
    "resize_pixelated": "ドット優先"
  }
}
</i18n>
