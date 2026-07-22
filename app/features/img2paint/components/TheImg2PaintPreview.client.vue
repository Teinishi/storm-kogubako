<script setup lang="ts">
import { paintCanvas } from '../renderer';
import type { Img2PaintState } from '../types';
import type { DrawData } from '../utils';

const GRID_LINE_WIDTH = 2;

const { t } = useI18n({ useScope: 'local' });

const props = defineProps<{
  state: Img2PaintState;
  baseDrawData: DrawData;
  glowOffset: Vec2;
}>();

const showGrid = ref(true);
const showGlow = ref(true);
const previewBloom = ref(true);
const previewZoom = ref(5);
const gridCssSize = computed(() => {
  return `${9 * previewZoom.value}px`;
});

// <canvas> を取得
const baseCanvas = useTemplateRef('baseCanvas');
const glowCanvas = useTemplateRef('glowCanvas');

watch(
  [props, showGlow],
  async () => {
    if (baseCanvas.value && glowCanvas.value) {
      paintCanvas(
        props.state,
        props.baseDrawData,
        props.glowOffset,
        showGlow.value,
        baseCanvas.value,
        glowCanvas.value,
        true,
      );
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="relative flex flex-col">
    <div
      class="z-10 flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center gap-4">
        <USwitch v-model="showGrid" :label="t('grid')" />
        <USwitch v-if="state.glowImage" v-model="showGlow" :label="t('glow')" />
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm">{{ t('zoom') }}: x{{ previewZoom }}</span>
          <USlider v-model="previewZoom" :min="1" :max="10" class="w-32" />
        </div>
        <USwitch
          v-if="state.glowImage"
          v-model="previewBloom"
          :disabled="!showGlow"
          :label="t('bloom')"
        />
      </div>
    </div>

    <div class="relative flex flex-1 overflow-auto p-4">
      <div
        class="relative m-auto flex-none shadow-lg"
        :style="{
          width: `${baseDrawData.canvasWidth * previewZoom}px`,
          height: `${baseDrawData.canvasHeight * previewZoom}px`,
        }"
      >
        <canvas
          ref="baseCanvas"
          class="absolute inset-0 h-full w-full"
          style="image-rendering: pixelated"
        />
        <canvas
          v-show="showGlow && previewBloom"
          ref="glowCanvas"
          class="absolute inset-0 h-full w-full"
          style="image-rendering: pixelated; mix-blend-mode: screen"
          :style="{ filter: `blur(${1 * previewZoom}px) brightness(200%)` }"
        />
        <div
          v-if="showGrid"
          class="pointer-events-none absolute inset-0 opacity-80"
          :style="{
            margin: `${-GRID_LINE_WIDTH / 2}px`,
            borderColor: '#6ED7FF',
            borderRightWidth: `${GRID_LINE_WIDTH}px`,
            borderBottomWidth: `${GRID_LINE_WIDTH}px`,
            backgroundImage: `linear-gradient(to right, #6ED7FF ${GRID_LINE_WIDTH}px, transparent 1px), linear-gradient(to bottom, #6ED7FF ${GRID_LINE_WIDTH}px, transparent 1px)`,
            backgroundSize: `${gridCssSize} ${gridCssSize}`,
          }"
        />
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "grid": "Grid",
    "glow": "Glow",
    "zoom": "Zoom",
    "bloom": "Bloom"
  },
  "ja": {
    "grid": "グリッド",
    "glow": "発光",
    "zoom": "拡大率",
    "bloom": "ブルーム"
  }
}
</i18n>
