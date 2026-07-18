<script setup lang="ts">
import AnchorSettings from './AnchorSettings.vue';
import ResizeSettings from './ResizeSettings.vue';
import type { Img2PaintState } from '../models/Img2PaintState';
import type { DrawData } from '../utils/anchor';
import { adjustAdditiveImage, convertAdditiveImage } from '../utils/imageProcessing';

const { t } = useI18n({ useScope: 'local' });

const props = defineProps<{
  baseImageSize: { width: number; height: number; isMultiplesOf9: boolean } | null;
  glowImageSize: { width: number; height: number; isMultiplesOf9: boolean } | null;
  imageSizeMatched: boolean;
  baseDrawData: DrawData;
}>();

const emit = defineEmits<{
  (e: 'saveVehicle'): void;
}>();

const state = defineModel<Img2PaintState>({ required: true });

const separateSettings = computed(() => state.value.glowImage && !props.imageSizeMatched);

const marginExists = computed(() => {
  const { offset, canvasWidth, canvasHeight } = props.baseDrawData;
  return offset.x !== 0
    || offset.y !== 0
    || canvasWidth !== state.value.baseResize.widthPixels
    || canvasHeight !== state.value.baseResize.heightPixels;
});

// 詳細設定の表示/非表示
const detailCollapsing = ref<string | string[]>([]);
watchEffect(() => {
  if (
    (props.baseImageSize && !props.baseImageSize.isMultiplesOf9)
    || (props.glowImageSize && !props.glowImageSize.isMultiplesOf9)
    || separateSettings.value
  ) {
    detailCollapsing.value = '0';
  }
});

function updateSaveFileName(file: File | null | undefined) {
  const filename = file?.name;
  state.value.saveFileName = filename ? replaceExtension(filename, '.xml') : 'file.xml';
}

// 画像ファイル読み込み
function fileDropped(file: File[] | null | undefined) {
  if (!file) {
    state.value.baseImageFile = null;
    return;
  }

  state.value.baseImageFile = file[0] ?? null;
  state.value.glowImageFile = file[1] ?? null;
  updateSaveFileName(state.value.baseImageFile);
}

function updateBaseImage(image: HTMLImageElement | null) {
  state.value.baseImage = image;
  if (image) {
    state.value.baseResize.widthPixels = image.width;
    state.value.baseResize.heightPixels = image.height;
  }
}

function updateGlowImage(image: HTMLImageElement | null) {
  if (!image) {
    state.value.glowImageRaw = null;
    state.value.glowImage = null;
    state.value.glowImageDisplay = null;
    return;
  }
  state.value.glowImageRaw = image;
  const adjustedImage = state.value.adjustGlow ? adjustAdditiveImage(image) : image;
  state.value.glowImage = adjustedImage;
  state.value.glowImageDisplay = convertAdditiveImage(adjustedImage);
  if (image) {
    state.value.glowResize.widthPixels = image.width;
    state.value.glowResize.heightPixels = image.height;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <template v-if="!state.baseImage">
      <FormCard>
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
      </FormCard>
    </template>

    <div
      v-show="state.baseImage"
      class="flex flex-col gap-4"
    >
      <FormCard>
        <h2 class="font-bold text-lg">
          {{ t('image_file') }}
        </h2>

        <div class="space-y-4">
          <ImageFileUpload
            v-model="state.baseImageFile"
            :label="t('base_image')"
            @update:image="updateBaseImage"
            @update:model-value="updateSaveFileName"
          />
          <ImageFileUpload
            v-model="state.glowImageFile"
            :label="t('glow_image')"
            removable
            @update:image="updateGlowImage"
          />

          <USwitch
            v-if="state.glowImage"
            v-model="state.adjustGlow"
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
      </FormCard>

      <UAccordion
        v-model="detailCollapsing"
        :items="[{ label: t('advanced_settings') }]"
      >
        <template #body>
          <div class="flex flex-col gap-4">
            <ResizeSettings
              v-if="baseImageSize"
              v-model="state.baseResize"
              :label="separateSettings ? t('dimensions_base') : t('dimensions')"
              :image-size="baseImageSize"
              :size-blocks="{ width: baseDrawData.widthBlocks, height: baseDrawData.heightBlocks }"
            />

            <AnchorSettings
              v-model="state.baseResize.anchor"
              :label="separateSettings ? t('position_base') : t('position')"
              :anchor-disabled="baseDrawData.isMultiplesOf9"
            />

            <template v-if="separateSettings">
              <ResizeSettings
                v-if="glowImageSize"
                v-model="state.glowResize"
                :label="t('dimensions_glow')"
                :image-size="glowImageSize"
              />

              <AnchorSettings
                v-model="state.glowResize.anchor"
                :label="t('position_glow')"
              />
            </template>

            <FormCard v-show="marginExists">
              <h2 class="font-bold text-lg">
                {{ t('background') }}
              </h2>

              <ColorPicker v-model="state.bgColor" />

              <div class="text-xs text-gray-500">
                {{ t('background_description') }}
              </div>
            </FormCard>
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
              v-model="state.minimizeSigns"
              :label="t('minimize_signs')"
            />
            <template v-if="state.glowImage">
              <USwitch
                v-model="state.minimizeIndicators"
                :label="t('minimize_indicators')"
              />
              <USwitch
                v-model="state.enableLogicLinks"
                :label="t('logic_links_enabled')"
              />
              <USwitch
                v-model="state.enableEletricLinks"
                :label="t('electric_links_enabled')"
              />
            </template>

            <div class="flex gap-4">
              <UFormField
                class="grow"
                :label="t('file_name')"
              >
                <UInput
                  v-model="state.saveFileName"
                  class="w-full"
                />
              </UFormField>

              <UButton
                class="self-end"
                icon="i-lucide-download"
                @click="emit('saveVehicle'); close()"
              >
                {{ t('save_file') }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </div>
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
    "bloom": "Bloom"
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
    "bloom": "ブルーム"
  }
}
</i18n>
