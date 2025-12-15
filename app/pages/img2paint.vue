<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { AnchorPosition } from '~/components/AnchorPositionSelect.vue';
import type { AnchorSettings } from '~/components/AnchorSettings.vue';
import type { ResizeSettings } from '~/components/ResizeSettings.vue';

useHead({ title: 'ペインタブルブロック変換' });
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
const bgColorHex = ref('#FFFFFF');
const bgColorRgb = computed(() => hexToRgb(bgColor.value));

const updateBgColorHex = () => {
  bgColor.value = rgbToHex(hexToRgb(bgColorHex.value));
  bgColorHex.value = bgColor.value;
};
const updateBgColorRgb = (value: number | null, channel: 'r' | 'g' | 'b') => {
  if (!value) return;
  const newColor = { ...bgColorRgb.value };
  if (channel === 'r') {
    newColor.r = value;
  }
  else if (channel === 'g') {
    newColor.g = value;
  }
  else {
    newColor.b = value;
  }
  bgColor.value = rgbToHex(newColor);
};

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
  <UContainer class="grow overflow-hidden py-4 grid grid-cols-1 grid-rows-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
      <h1 class="text-2xl font-bold">
        ペインタブルブロック変換
      </h1>

      <div
        v-if="!baseImage"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4"
      >
        <p>画像から Stormworks のペインタブルブロックへ変換するツールです。変換後のビークルXMLファイルを保存して、Stormworks 上で既存ビークルに追加読み込みすることができます。</p>
        <p>処理はすべてブラウザ上で完結し、画像を外部へ送信することはありません。</p>
        <p>まずは画像を選択してみてください。</p>
      </div>

      <div
        v-show="baseImage"
        class="flex flex-col gap-4"
      >
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <h2 class="font-bold text-lg">
            画像ファイル
          </h2>

          <div class="space-y-4">
            <ImageFileUpload
              v-model="baseImageFile"
              label="基本画像"
              @update:image="updateBaseImage"
              @update:model-value="updateSaveFileName"
            />
            <ImageFileUpload
              v-model="glowImageFile"
              label="発光画像"
              removable
              @update:image="updateGlowImage"
            />

            <USwitch
              v-if="glowImage"
              v-model="adjustGlow"
              label="発光の明るさを補正"
            />
          </div>

          <UAlert
            v-if="separateSettings"
            color="primary"
            variant="soft"
            title="画像サイズが異なります"
            description="サイズ・位置は別々に指定してください"
            icon="i-lucide-info"
          />
        </div>

        <UAccordion
          v-model="detailCollapsing"
          :items="[{ label: '詳細設定' }]"
        >
          <template #body>
            <div class="flex flex-col gap-4">
              <ResizeSettings
                v-if="baseImageSize"
                v-model="baseResizeSettings"
                :label="`サイズ設定` + (separateSettings ? ' (基本)' : '')"
                :image-size="baseImageSize"
                :size-blocks="{ width: baseDrawData.widthBlocks, height: baseDrawData.heightBlocks }"
              />

              <AnchorSettings
                v-model="baseAnchorSettings"
                :label="'位置調整' + (separateSettings ? ' (基本)' : '')"
                :anchor-disabled="baseDrawData.isMultiplesOf9"
              />

              <template v-if="separateSettings">
                <ResizeSettings
                  v-if="glowImageSize"
                  v-model="glowResizeSettings"
                  label="サイズ設定 (発光)"
                  :image-size="glowImageSize"
                />

                <AnchorSettings
                  v-model="glowAnchorSettings"
                  label="位置調整 (発光)"
                />
              </template>

              <div
                v-show="marginExists"
                class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4"
              >
                <h2 class="font-bold text-lg">
                  背景
                </h2>

                <UPopover class="grow">
                  <UButton
                    label="色を選択"
                    color="neutral"
                    variant="outline"
                  >
                    <template #leading>
                      <span
                        :style="{ backgroundColor: bgColor }"
                        class="size-3 rounded-full ring ring-accented"
                      />
                    </template>
                  </UButton>

                  <template #content>
                    <div class="p-4 flex flex-col gap-2">
                      <UColorPicker v-model="bgColor" />

                      <UFormField
                        label="HEX"
                        size="sm"
                      >
                        <UInput
                          v-model="bgColorHex"
                          class="w-full"
                          @change="updateBgColorHex"
                        />
                      </UFormField>

                      <div class="grid grid-cols-3 gap-1">
                        <UFormField
                          label="R"
                          size="sm"
                        >
                          <UInputNumber
                            :model-value="bgColorRgb.r"
                            :min="0"
                            :max="255"
                            orientation="vertical"
                            placeholder="R"
                            class="w-16"
                            @update:model-value="updateBgColorRgb($event, 'r')"
                          />
                        </UFormField>
                        <UFormField
                          label="G"
                          size="sm"
                        >
                          <UInputNumber
                            :model-value="bgColorRgb.g"
                            :min="0"
                            :max="255"
                            orientation="vertical"
                            placeholder="G"
                            size="sm"
                            class="w-16"
                            @update:model-value="updateBgColorRgb($event, 'g')"
                          />
                        </UFormField>
                        <UFormField
                          label="B"
                          size="sm"
                        >
                          <UInputNumber
                            :model-value="bgColorRgb.b"
                            :min="0"
                            :max="255"
                            orientation="vertical"
                            placeholder="B"
                            size="sm"
                            class="w-16"
                            @update:model-value="updateBgColorRgb($event, 'b')"
                          />
                        </UFormField>
                      </div>
                    </div>
                  </template>
                </UPopover>

                <div class="text-xs text-gray-500">
                  ※余白が生じたときの背景色を変更できます
                </div>
              </div>
            </div>
          </template>
        </UAccordion>

        <UModal title="ビークルXMLを保存">
          <UButton
            block
            size="xl"
            color="primary"
            class="mt-auto"
          >
            ビークルXMLを保存
          </UButton>

          <template
            #body="{ close }"
          >
            <div class="space-y-4">
              <USwitch
                v-model="minimizeSigns"
                label="単色の部分は通常ブロックにする"
              />
              <template v-if="glowImage">
                <USwitch
                  v-model="minimizeIndicators"
                  label="発光しない部分は Paintable Sign にする"
                />
                <USwitch
                  v-model="logicLinksEnabled"
                  label="On/Off ロジック配線"
                />
                <USwitch
                  v-model="electricLinksEnabled"
                  label="電気配線"
                />
              </template>

              <div class="flex gap-4">
                <UFormField
                  class="grow"
                  label="ファイル名"
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
                  ファイルを保存
                </UButton>
              </div>
            </div>
          </template>
        </UModal>
      </div>
    </div>

    <div
      v-if="!baseImage"
      class="lg:col-span-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <UFileUpload
        label="画像を選択"
        description="ドラッグ＆ドロップまたはクリック"
        accept="image/*"
        :preview="false"
        class="w-full h-full"
        :ui="{ base: 'bg-transparent border-none' }"
        multiple
        @update:model-value="fileDropped"
      />
    </div>

    <div
      v-show="baseImage"
      class="lg:col-span-8 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative"
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800 flex items-center justify-between z-10">
        <div class="flex items-center gap-4">
          <USwitch
            v-model="showGrid"
            label="グリッド"
          />
          <USwitch
            v-if="glowImage"
            v-model="showGlow"
            label="発光"
          />
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm">拡大率: x{{ previewZoom }}</span>
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
            label="ブルーム"
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
  </UContainer>
</template>
