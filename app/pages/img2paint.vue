<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { AnchorPosition } from '~/components/AnchorPositionSelect.vue';
import type { AnchorSettings } from '~/components/AnchorSettings.vue';
import type { ResizeSettings } from '~/components/ResizeSettings.vue';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('img2paint') });
definePageMeta({ layout: 'app' });

const GRID_LINE_WIDTH = 2;

const replaceExtension = (filename: string, ext: string) => {
  ext = ext.startsWith('.') ? ext : `.${ext}`;
  return filename.replace(/\.[^/\\.]+$/, '') + ext;
};

const getImageSize = (img: HTMLImageElement | HTMLCanvasElement | null) => {
  if (!img) return null;
  const { width, height } = img;
  return {
    width: width,
    height: height,
    aspect: width / height,
    isMultiplesOf9: width % 9 === 0 && height % 9 === 0,
  };
};

const getAnchorOffset = (drawWidth: number, drawHeight: number, canvasWidth: number, canvasHeight: number, anchor: AnchorPosition) => {
  // AnchporPosition 名からオフセット値に変換
  let x = 0;

  switch (anchor) {
    case 'top-center':
    case 'center':
    case 'bottom-center':
      x = (canvasWidth - drawWidth) / 2;
      break;
    case 'top-right':
    case 'mid-right':
    case 'bottom-right':
      x = canvasWidth - drawWidth;
      break;
  }

  let y = 0;
  switch (anchor) {
    case 'mid-left':
    case 'center':
    case 'mid-right':
      y = (canvasHeight - drawHeight) / 2;
      break;
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      y = canvasHeight - drawHeight;
      break;
  }

  return { x, y };
};

const getDrawData = (width: number, height: number, anchorSettings: AnchorSettings) => {
  // キャンバスサイズ、オフセットを計算
  let widthBlocks = Math.ceil(width / 9);
  let heightBlocks = Math.ceil(height / 9);

  // オフセットを計算
  let { x: drawOffsetX, y: drawOffsetY } = getAnchorOffset(width, height, widthBlocks * 9, heightBlocks * 9, anchorSettings.anchorPosition);
  drawOffsetX += anchorSettings.offsetX;
  drawOffsetY += anchorSettings.offsetY;

  // オフセットによりはみ出したらキャンバスサイズを拡大
  const left = Math.floor(drawOffsetX);
  if (left < 0) {
    // 左方向にキャンバスを拡大
    const e = Math.ceil(-left / 9);
    drawOffsetX += e * 9;
    widthBlocks += e;
  }

  const right = Math.ceil(drawOffsetX + width);
  if (right > widthBlocks * 9) {
    // 右方向にキャンバスを拡大
    widthBlocks += Math.ceil((right - widthBlocks * 9) / 9);
  }

  const top = Math.floor(drawOffsetY);
  if (top < 0) {
    // 上方向にキャンバスを拡大
    const e = Math.ceil(-top / 9);
    drawOffsetY += e * 9;
    heightBlocks += e;
  }

  const bottom = Math.ceil(drawOffsetY + height);
  if (bottom > heightBlocks * 9) {
    // 下方向にキャンバスを拡大
    heightBlocks += Math.ceil((bottom - heightBlocks * 9) / 9);
  }

  return {
    widthBlocks, heightBlocks,
    canvasWidth: widthBlocks * 9,
    canvasHeight: heightBlocks * 9,
    offsetX: drawOffsetX,
    offsetY: drawOffsetY,
    isMultiplesOf9: width % 9 === 0 && height % 9 === 0,
  };
};

const toast = useToast();

// 元画像
const baseImageFile = ref<File | null>(null);
const baseImage = ref<HTMLImageElement | null>(null);
const glowImageFile = ref<File | null>(null);
const glowImageRaw = ref<HTMLImageElement | null>(null);
const glowImage = ref<HTMLImageElement | HTMLCanvasElement | null>(null);
const glowImageDisplay = ref<HTMLCanvasElement | null>(null);
const adjustGlow = ref(true);

const baseImageSize = computed(() => getImageSize(baseImage.value));
const glowImageSize = computed(() => getImageSize(glowImage.value));
const imageSizeMatched = computed(() => {
  if (!baseImageSize.value || !glowImageSize.value) return false;
  return baseImageSize.value.width === glowImageSize.value.width && baseImageSize.value.height === glowImageSize.value.height;
});
const separateSettings = computed(() => glowImage.value && !imageSizeMatched.value);

// 画像ファイル読み込み
const fileDropped = (file: File[] | null | undefined) => {
  if (!file) {
    baseImageFile.value = null;
    return;
  }

  baseImageFile.value = file[0] ?? null;
  glowImageFile.value = file[1] ?? null;
  updateSaveFileName(baseImageFile.value);
};

const updateBaseImage = (image: HTMLImageElement | null) => {
  baseImage.value = image;
  if (image) {
    baseResizeSettings.value.widthPixels = image.width;
    baseResizeSettings.value.heightPixels = image.height;
  }
};
const updateGlowImage = (image: HTMLImageElement | null) => {
  if (!image) {
    glowImageRaw.value = null;
    glowImage.value = null;
    glowImageDisplay.value = null;
    return;
  }
  glowImageRaw.value = image;
  const adjustedImage = adjustGlow.value ? adjustAdditiveImage(image) : image;
  glowImage.value = adjustedImage;
  glowImageDisplay.value = convertAdditiveImage(adjustedImage);
  if (image) {
    glowResizeSettings.value.widthPixels = image.width;
    glowResizeSettings.value.heightPixels = image.height;
  }
};

watch(adjustGlow, () => {
  updateGlowImage(glowImageRaw.value);
});

// 詳細設定の表示/非表示
const detailCollapsing = ref<string | string[]>([]);
watch([baseImageSize, glowImageSize, separateSettings], () => {
  if (
    (baseImageSize.value && !baseImageSize.value.isMultiplesOf9)
    || (glowImageSize.value && !glowImageSize.value?.isMultiplesOf9)
    || separateSettings.value
  ) {
    detailCollapsing.value = '0';
  }
});

// 設定値
const baseResizeSettings = ref<ResizeSettings>({
  sizeType: 'block',
  keepAspect: true,
  sizePriority: 'width',
  widthPixels: 9,
  heightPixels: 9,
  resizeAlgo: 'pixelated',
});
const baseAnchorSettings = ref<AnchorSettings>({
  anchorPosition: 'center',
  offsetX: 0,
  offsetY: 0,
});

const glowResizeSettings = ref<ResizeSettings>({
  sizeType: 'block',
  keepAspect: true,
  sizePriority: 'width',
  widthPixels: 9,
  heightPixels: 9,
  resizeAlgo: 'pixelated',
});
const glowAnchorSettings = ref<AnchorSettings>({
  anchorPosition: 'center',
  offsetX: 0,
  offsetY: 0,
});

const bgColor = ref('#FFFFFF');

const baseDrawData = computed(() => getDrawData(baseResizeSettings.value.widthPixels, baseResizeSettings.value.heightPixels, baseAnchorSettings.value));
const glowDrawData = computed(() => {
  const { x, y } = getAnchorOffset(glowResizeSettings.value.widthPixels, glowResizeSettings.value.heightPixels, baseResizeSettings.value.widthPixels, baseResizeSettings.value.heightPixels, glowAnchorSettings.value.anchorPosition);
  const v = {
    offsetX: x + glowAnchorSettings.value.offsetX + baseDrawData.value.offsetX,
    offsetY: y + glowAnchorSettings.value.offsetY + baseDrawData.value.offsetY,
  };
  if (imageSizeMatched.value) {
    return { ...baseDrawData.value };
  }
  return v;
});

const marginExists = computed(() => {
  const { offsetX, offsetY, canvasWidth, canvasHeight } = baseDrawData.value;
  return offsetX !== 0 || offsetY !== 0 || canvasWidth !== baseResizeSettings.value.widthPixels || canvasHeight !== baseResizeSettings.value.heightPixels;
});

watch([imageSizeMatched, baseResizeSettings], () => {
  if (imageSizeMatched.value) {
    glowResizeSettings.value = { ...baseResizeSettings.value };
  }
}, { deep: true });

// プレビュー
const showGrid = ref(true);
const showGlow = ref(true);
const previewBloom = ref(true);
const previewZoom = ref(5);
const gridCssSize = computed(() => {
  return `${9 * previewZoom.value}px`;
});

// 保存設定
const minimizeSigns = ref(true);
const minimizeIndicators = ref(true);
const logicLinksEnabled = ref(true);
const electricLinksEnabled = ref(true);
const saveFileName = ref('file.xml');

const updateSaveFileName = (file: File | null | undefined) => {
  const filename = file?.name;
  saveFileName.value = filename ? replaceExtension(filename, '.xml') : 'file.xml';
};

// <canvas> を取得
const baseCanvas = useTemplateRef('baseCanvas');
const glowCanvas = useTemplateRef('glowCanvas');

// リサイズ描画処理
const drawResizedImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, resizeSettings: ResizeSettings, drawData: { offsetX: number; offsetY: number }) => {
  let { offsetX, offsetY } = drawData;
  let drawWidth = resizeSettings.widthPixels;
  let drawHeight = resizeSettings.heightPixels;
  if (resizeSettings.resizeAlgo === 'smooth') {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  else {
    ctx.imageSmoothingEnabled = false;
    offsetX = Math.round(offsetX);
    offsetY = Math.round(offsetY);
    drawWidth = Math.round(drawWidth);
    drawHeight = Math.round(drawHeight);
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

watch(
  [baseImage, glowImageDisplay, baseResizeSettings, baseDrawData, glowResizeSettings, glowDrawData, bgColor, showGlow],
  () => {
    if (baseCanvas.value && glowCanvas.value) {
      paintCanvas(baseCanvas.value, glowCanvas.value, true);
    }
  },
  { deep: true },
);
const paintCanvas = (baseCanvas: HTMLCanvasElement, glowCanvas?: HTMLCanvasElement, displayMode?: boolean) => {
  // 描画
  if (!baseImage.value) return;
  const { canvasWidth, canvasHeight } = baseDrawData.value;
  baseCanvas.width = canvasWidth;
  baseCanvas.height = canvasHeight;
  const bCtx = baseCanvas.getContext('2d')!;

  bCtx.fillStyle = bgColor.value;
  bCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawResizedImage(bCtx, baseImage.value, baseResizeSettings.value, baseDrawData.value);

  // 発光キャンバスをリセット
  if (!glowCanvas) return;
  glowCanvas.width = canvasWidth;
  glowCanvas.height = canvasHeight;
  const gCtx = glowCanvas.getContext('2d')!;

  if (displayMode) {
    gCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  else {
    gCtx.fillStyle = '#000';
    gCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 発光描画
  if (!showGlow.value) return;
  if (displayMode) {
    if (glowImageDisplay.value) {
      bCtx.globalCompositeOperation = 'lighter';
      drawResizedImage(bCtx, glowImageDisplay.value, glowResizeSettings.value, glowDrawData.value);
      drawResizedImage(gCtx, glowImageDisplay.value, glowResizeSettings.value, glowDrawData.value);
    }
  }
  else if (glowImage.value) {
    drawResizedImage(gCtx, glowImage.value, glowResizeSettings.value, glowDrawData.value);
  }
};

// XML生成・保存
const saveVehicleXml = () => {
  if (!baseImageFile.value) return;

  const baseCanvas = document.createElement('canvas');
  const glowCanvas = glowImage.value ? document.createElement('canvas') : undefined;
  paintCanvas(baseCanvas, glowCanvas, false);

  const { canvasWidth: width, canvasHeight: height } = baseDrawData.value;
  const baseImageData = baseCanvas.getContext('2d')!.getImageData(0, 0, width, height);
  const glowImageData = glowCanvas?.getContext('2d')?.getImageData(0, 0, width, height);

  const xml = generatePaintableSignVehicle(
    baseDrawData.value.canvasWidth,
    baseDrawData.value.canvasHeight,
    baseImageData.data,
    glowImageData?.data,
    {
      minimizeSigns: minimizeSigns.value,
      minimizeIndicators: minimizeIndicators.value,
      logicLinks: logicLinksEnabled.value,
      electricLinks: electricLinksEnabled.value,
    },
  );
  const blob = new Blob([xml], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = saveFileName.value;
  link.click();
  URL.revokeObjectURL(link.href);

  toast.add({
    title: '保存しています',
    description: 'ダウンロードフォルダをご確認ください',
    icon: 'i-lucide-check',
  });
};
</script>

<template>
  <div class="h-full grid sm:grid-cols-[24rem_1fr]">
    <div class="h-screen flex flex-col">
      <AppTitle :title="gt('img2paint')" />

      <div class="grow flex flex-col px-4 pt-0 pb-18 sm:pb-4 gap-4 overflow-y-auto">
        <template v-if="!baseImage">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <UFileUpload
              :label="t('pick_image_file')"
              :description="t('pick_image_file_description')"
              accept="image/*"
              :preview="false"
              class="w-full"
              multiple
              @update:model-value="fileDropped"
            />

            <UAlert
              color="neutral"
              variant="soft"
              icon="i-lucide-info"
              :title="t('no_files')"
              :description="t('no_files_description')"
            />
          </div>
        </template>

        <div
          v-show="baseImage"
          class="flex flex-col gap-4"
        >
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <h2 class="font-bold text-lg">
              {{ t('image_file') }}
            </h2>

            <div class="space-y-4">
              <ImageFileUpload
                v-model="baseImageFile"
                :label="t('base_image')"
                @update:image="updateBaseImage"
                @update:model-value="updateSaveFileName"
              />
              <ImageFileUpload
                v-model="glowImageFile"
                :label="t('glow_image')"
                removable
                @update:image="updateGlowImage"
              />

              <USwitch
                v-if="glowImage"
                v-model="adjustGlow"
                :label="t('adjust_glow')"
              />
            </div>

            <UAlert
              v-if="separateSettings"
              color="primary"
              variant="soft"
              :title="t('image_size_mismatch1')"
              :description="t('image_size_mismatch2')"
              icon="i-lucide-info"
            />
          </div>

          <UAccordion
            v-model="detailCollapsing"
            :items="[{ label: t('advanced_settings') }]"
          >
            <template #body>
              <div class="flex flex-col gap-4">
                <ResizeSettings
                  v-if="baseImageSize"
                  v-model="baseResizeSettings"
                  :label="separateSettings ? t('dimensions_base') : t('dimensions')"
                  :image-size="baseImageSize"
                  :size-blocks="{ width: baseDrawData.widthBlocks, height: baseDrawData.heightBlocks }"
                />

                <AnchorSettings
                  v-model="baseAnchorSettings"
                  :label="separateSettings ? t('position_base') : t('position')"
                  :anchor-disabled="baseDrawData.isMultiplesOf9"
                />

                <template v-if="separateSettings">
                  <ResizeSettings
                    v-if="glowImageSize"
                    v-model="glowResizeSettings"
                    :label="t('dimensions_glow')"
                    :image-size="glowImageSize"
                  />

                  <AnchorSettings
                    v-model="glowAnchorSettings"
                    :label="t('position_glow')"
                  />
                </template>

                <div
                  v-show="marginExists"
                  class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4"
                >
                  <h2 class="font-bold text-lg">
                    {{ t('background') }}
                  </h2>

                  <ColorPicker v-model="bgColor" />

                  <div class="text-xs text-gray-500">
                    {{ t('background_description') }}
                  </div>
                </div>
              </div>
            </template>
          </UAccordion>

          <UModal :title="t('save_vehicle_xml')">
            <UButton
              block
              size="xl"
              color="primary"
              class="mt-auto"
            >
              {{ t('save_vehicle_xml') }}
            </UButton>

            <template
              #body="{ close }"
            >
              <div class="space-y-4">
                <USwitch
                  v-model="minimizeSigns"
                  :label="t('minimize_signs')"
                />
                <template v-if="glowImage">
                  <USwitch
                    v-model="minimizeIndicators"
                    :label="t('minimize_indicators')"
                  />
                  <USwitch
                    v-model="logicLinksEnabled"
                    :label="t('logic_links_enabled')"
                  />
                  <USwitch
                    v-model="electricLinksEnabled"
                    :label="t('electric_links_enabled')"
                  />
                </template>

                <div class="flex gap-4">
                  <UFormField
                    class="grow"
                    :label="t('file_name')"
                  >
                    <UInput
                      v-model="saveFileName"
                      class="w-full"
                    />
                  </UFormField>

                  <UButton
                    class="self-end"
                    icon="i-lucide-download"
                    @click="saveVehicleXml(); close()"
                  >
                    {{ t('save_file') }}
                  </UButton>
                </div>
              </div>
            </template>
          </UModal>
        </div>
      </div>
    </div>

    <ResponsivePanel
      :label="t('preview')"
      icon="i-lucide-eye"
      :disabled="!baseImage"
    >
      <div
        v-show="baseImage"
        class="w-full h-full flex flex-col relative"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between z-10">
          <div class="flex items-center gap-4">
            <USwitch
              v-model="showGrid"
              :label="t('grid')"
            />
            <USwitch
              v-if="glowImage"
              v-model="showGlow"
              :label="t('glow')"
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ t('zoom') }}: x{{ previewZoom }}</span>
              <USlider
                v-model="previewZoom"
                :min="1"
                :max="10"
                class="w-32"
              />
            </div>
            <USwitch
              v-if="glowImage"
              v-model="previewBloom"
              :disabled="!showGlow"
              :label="t('bloom')"
            />
          </div>
        </div>

        <div class="flex-1 flex overflow-auto relative p-4">
          <div
            class="m-auto flex-none relative shadow-lg"
            :style="{ width: `${baseDrawData.canvasWidth * previewZoom}px`, height: `${baseDrawData.canvasHeight * previewZoom}px` }"
          >
            <canvas
              ref="baseCanvas"
              class="absolute inset-0 w-full h-full"
              style="image-rendering: pixelated;"
            />
            <canvas
              v-show="showGlow && previewBloom"
              ref="glowCanvas"
              class="absolute inset-0 w-full h-full"
              style="image-rendering: pixelated; mix-blend-mode: screen;"
              :style="{ filter: `blur(${1 * previewZoom}px) brightness(200%)` }"
            />
            <div
              v-if="showGrid"
              class="absolute inset-0 pointer-events-none opacity-80"
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
    </ResponsivePanel>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "pick_image_file": "Pick Image File",
    "pick_image_file_description": "Click, or drop files here",
    "no_files": "Pick an image file",
    "no_files_description": "Pick an image file to convert into paintable blocks and save the vehicle XML file.",
    "image_file": "Image File",
    "base_image": "Base Image",
    "glow_image": "Glow Image",
    "adjust_glow": "Adjust glow intensity",
    "image_size_mismatch1": "Dimensions of the images are not identical",
    "image_size_mismatch2": "Set the size and the position for each images.",
    "advanced_settings": "Advanced Settings",
    "dimensions": "Dimensions",
    "dimensions_base": "Dimensions (Base)",
    "dimensions_glow": "Dimensions (Glow)",
    "position": "Position",
    "position_base": "Position (Base)",
    "position_glow": "Position (Glow)",
    "background": "Background",
    "pick_color": "Pick Color",
    "background_description": "You can change the background color when white space appears.",
    "save_vehicle_xml": "Save Vehicle XML",
    "minimize_signs": "Use normal blocks for single color part",
    "minimize_indicators": "Use non-indicator for no glowing part",
    "logic_links_enabled": "On/Off logic links for indicators",
    "electric_links_enabled": "Electric links for indicators",
    "file_name": "File Name",
    "save_file": "Save File",
    "grid": "Grid",
    "glow": "Glow",
    "zoom": "Zoom",
    "bloom": "Bloom",
    "preview": "Preview"
  },
  "ja": {
    "pick_image_file": "画像を選択",
    "pick_image_file_description": "ドラッグ＆ドロップまたはクリック",
    "no_files": "画像ファイルを選択してください",
    "no_files_description": "画像ファイルを選択するとペインタブルブロックに変換してビークルXMLファイルを保存できます。",
    "image_file": "画像ファイル",
    "base_image": "基本画像",
    "glow_image": "発光画像",
    "adjust_glow": "発光の明るさを補正",
    "image_size_mismatch1": "画像サイズが異なります",
    "image_size_mismatch2": "サイズ・位置は別々に指定してください",
    "advanced_settings": "詳細設定",
    "dimensions": "サイズ設定",
    "dimensions_base": "サイズ設定 (基本)",
    "dimensions_glow": "サイズ設定 (発光)",
    "position": "位置設定",
    "position_base": "位置設定 (基本)",
    "position_glow": "位置設定 (発光)",
    "background": "背景",
    "pick_color": "色を選択",
    "background_description": "※余白が生じたときの背景色を変更できます",
    "save_vehicle_xml": "ビークルXMLを保存",
    "minimize_signs": "単色の部分は通常ブロックにする",
    "minimize_indicators": "発光しない部分は Paintable Sign にする",
    "logic_links_enabled": "インジケーターの On/Off ロジック配線",
    "electric_links_enabled": "インジケーターの電気配線",
    "file_name": "ファイル名",
    "save_file": "ファイルを保存",
    "grid": "グリッド",
    "glow": "発光",
    "zoom": "拡大率",
    "bloom": "ブルーム",
    "preview": "プレビュー"
  }
}
</i18n>
