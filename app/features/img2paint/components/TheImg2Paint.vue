<script setup lang="ts">
import { useImg2Paint } from '../composables/useImg2Paint';
import TheImg2PaintSettings from './TheImg2PaintSettings.vue';
import TheImg2PaintPreview from './TheImg2PaintPreview.client.vue';
import { generatePaintableSignVehicle } from '../utils/generateVehicle';

const { t } = useI18n({ useScope: 'local' });

const { state, computedValues } = useImg2Paint();

const saveFile = useFileSave();

// XML生成・保存
async function saveVehicleXml() {
  if (!import.meta.client || !state.baseImageFile) return;

  const { baseDrawData } = computedValues.value;

  const { paintCanvas } = await import('../renderer/renderer.client');

  const baseCanvas = document.createElement('canvas');
  const glowCanvas = state.glowImage ? document.createElement('canvas') : undefined;
  paintCanvas(
    state,
    baseDrawData,
    computedValues.value.glowOffset,
    true,
    baseCanvas,
    glowCanvas,
    false,
  );

  const { canvasWidth: width, canvasHeight: height } = baseDrawData;
  const baseImageData = baseCanvas.getContext('2d')!.getImageData(0, 0, width, height);
  const glowImageData = glowCanvas?.getContext('2d')?.getImageData(0, 0, width, height);

  const xml = generatePaintableSignVehicle(
    width,
    height,
    baseImageData.data,
    glowImageData?.data,
    {
      minimizeSigns: state.minimizeSigns,
      minimizeIndicators: state.minimizeIndicators,
      logicLinks: state.enableLogicLinks,
      electricLinks: state.enableEletricLinks,
    },
  );
  const blob = new Blob([xml], { type: 'text/plain' });

  saveFile(blob, state.saveFileName);
};
</script>

<template>
  <div class="h-full grid sm:grid-cols-[24rem_1fr]">
    <div class="h-screen flex flex-col">
      <AppTitle />

      <TheImg2PaintSettings
        v-model="state"
        class="grow overflow-y-auto px-4 pt-0 pb-18 sm:pb-4 "
        v-bind="computedValues"
        @save-vehicle="saveVehicleXml"
      />
    </div>

    <ResponsivePanel
      :label="t('preview')"
      icon="i-lucide-eye"
      :disabled="!state.baseImage"
    >
      <ClientOnly>
        <TheImg2PaintPreview
          v-show="state.baseImage"
          class="w-full h-full "
          :state="state"
          v-bind="computedValues"
        />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "preview": "Preview"
  },
  "ja": {
    "preview": "プレビュー"
  }
}
</i18n>
