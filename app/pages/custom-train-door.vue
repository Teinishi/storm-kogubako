<script setup lang="ts">
import { ref } from 'vue';
import type { PolygonEditorValue } from '~/utils/polygonEditorCore';
import type { RenderHooks } from '~/composables/usePolygonEditorCanvas';

const FORMAT_OPTIONS_METER = {
  maximumFractionDigits: 5,
  style: 'unit',
  unit: 'meter',
} as const;

export interface TrainDoorState {
  doorWidth: number;
  doorHeight: number;
  doorThickness: number;
  doorZOffset: number;
  baseColor: string;
  rubberThickness: number;
  rubberColor: string;
  windowXOffset: number;
  windowYOffset: number;
  windowWidth: number;
  windowHeight: number;
  windowCornerRadius: number;
  windowCornerDivisions: number;
}

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });

const polygonEditor = useTemplateRef('polygonEditor');

const state = reactive<TrainDoorState>({
  doorWidth: 3,
  doorHeight: 8,
  doorThickness: 0.1,
  doorZOffset: 0,
  baseColor: '#c0c7cf',
  rubberThickness: 0.03,
  rubberColor: '#545454',
  windowXOffset: 0,
  windowYOffset: 0.125,
  windowWidth: 0.5,
  windowHeight: 1,
  windowCornerRadius: 0.08,
  windowCornerDivisions: 1,
});

const windowRect = computed(() => {
  const wBlocks = state.windowWidth / 0.25;
  const hBlocks = state.windowHeight / 0.25;
  const rubber = state.rubberThickness / 0.25;
  const x = (state.doorWidth - rubber - wBlocks) / 2 + rubber + state.windowXOffset / 0.25;
  const top = state.doorHeight - state.windowYOffset / 0.25;
  return {
    x,
    y: top - hBlocks,
    width: wBlocks,
    height: hBlocks,
  };
});

const windowPolygon = computed(() => createRoundedRectPolygon(
  windowRect.value,
  state.windowCornerRadius / 0.25,
  state.windowCornerDivisions,
));

const polygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });

const renderHooks: RenderHooks = {
  onBeforeRenderPolygons({ ctx, worldRectToCanvas }) {
    // ベースカラー描画
    const r = worldRectToCanvas({ x: 0, y: 0, width: state.doorWidth, height: state.doorHeight });
    ctx.fillStyle = state.baseColor;
    ctx.fillRect(r.x, r.y, r.width, r.height);
  },
  onBeforeRenderSelection({ editor, ctx, worldToCanvas, worldRectToCanvas }) {
    // 窓描画
    const points = windowPolygon.value;
    if (points.length < 3) return;

    const hasSelection = editor.selectedPolygonId.value !== null;
    ctx.globalAlpha = hasSelection ? 0.6 : 1;

    const midRing = offsetPolygon(points, 0.02 / 0.25 / 2);
    const outerRing = offsetPolygon(points, 0.02 / 0.25);

    const { y: top } = worldToCanvas({ x: 0, y: windowRect.value.y + windowRect.value.height });
    const { y: bottom } = worldToCanvas({ x: 0, y: windowRect.value.y });
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, 'hsl(220 75% 52%)');
    grad.addColorStop(1, 'hsl(177 33% 76%)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    polygonOnCanvas(ctx, hasSelection ? points : midRing, worldToCanvas);
    ctx.fill();

    ctx.fillStyle = '#545454';
    ctx.beginPath();
    polygonOnCanvas(ctx, points, worldToCanvas);
    polygonOnCanvas(ctx, outerRing, worldToCanvas);
    ctx.closePath();
    ctx.fill('evenodd');

    // 戸先ゴム描画
    ctx.fillStyle = state.rubberColor;
    const r = worldRectToCanvas({
      x: 0,
      y: 0,
      width: state.rubberThickness / 0.25,
      height: state.doorHeight,
    });
    ctx.fillRect(r.x, r.y, r.width, r.height);
  },
};

watch(windowPolygon, () => {
  polygonEditor.value?.renderCanvas();
});
</script>

<template>
  <div class="h-full grid sm:grid-cols-[7fr_5fr]">
    <div class="h-screen flex flex-col">
      <AppTitle :title="gt('custom_train_door')" />

      <div class="grow flex flex-col px-4 pt-0 pb-18 sm:pb-4 gap-4 overflow-y-auto">
        <div class="grid lg:grid-cols-2 gap-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <UFormField :label="t('door_width')">
                <div class="flex items-center gap-2">
                  <UInputNumber
                    v-model="state.doorWidth"
                    :step="1"
                    :min="1"
                    class="flex-1"
                  />
                  <span class="text-muted">{{ t('blocks') }}</span>
                </div>
              </UFormField>

              <UFormField :label="t('door_height')">
                <div class="flex items-center gap-2">
                  <UInputNumber
                    v-model="state.doorHeight"
                    :step="1"
                    :min="1"
                    class="flex-1"
                  />
                  <span class="text-muted">{{ t('blocks') }}</span>
                </div>
              </UFormField>

              <UFormField :label="t('door_thickness')">
                <UInputNumber
                  v-model="state.doorThickness"
                  :step="0.05"
                  :min="0.05"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('door_z_offset')">
                <UInputNumber
                  v-model="state.doorZOffset"
                  :step="0.05"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <ColorPicker
                v-model="state.baseColor"
                :label="t('base_color')"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <UFormField :label="t('rubber_thickness')">
                <UInputNumber
                  v-model="state.rubberThickness"
                  :step="0.01"
                  :min="0"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <ColorPicker
                v-model="state.rubberColor"
                :label="t('rubber_color')"
              />
            </div>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <UFormField :label="t('window_x_offset')">
                <UInputNumber
                  v-model="state.windowXOffset"
                  :step="0.0625"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_y_offset')">
                <UInputNumber
                  v-model="state.windowYOffset"
                  :step="0.0625"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_width')">
                <UInputNumber
                  v-model="state.windowWidth"
                  :step="0.0625"
                  :min="0"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_height')">
                <UInputNumber
                  v-model="state.windowHeight"
                  :step="0.0625"
                  :min="0"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_corner_radius')">
                <UInputNumber
                  v-model="state.windowCornerRadius"
                  :step="0.01"
                  :min="0"
                  class="w-full"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_corner_divisions')">
                <UInputNumber
                  v-model="state.windowCornerDivisions"
                  :step="1"
                  :min="1"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex-1 lg:min-h-0">
          <PolygonEditor
            ref="polygonEditor"
            v-model="polygonEditorValue"
            :logical-bounds="{ width: state.doorWidth, height: state.doorHeight }"
            :render-hooks="renderHooks"
            class="h-full"
          />
        </div>
      </div>
    </div>

    <ResponsivePanel
      icon="i-lucide-box"
      :label="t('preview')"
    >
      <ClientOnly>
        <TrainDoorPreview
          :state="state"
          :window-hole="windowPolygon"
          :polygon-editor-value="polygonEditorValue"
        />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "blocks": "Blocks",
    "door_width": "Door Width",
    "door_height": "Door Height",
    "door_thickness": "Door Thickness",
    "door_z_offset": "Door Z Offset",
    "base_color": "Base Color",
    "rubber_thickness": "Rubber Thickness",
    "rubber_color": "Rubber Color",
    "window_x_offset": "Window X Offset",
    "window_y_offset": "Window Y Offset",
    "window_width": "Window Width",
    "window_height": "Window Height",
    "window_corner_radius": "Window Corner Radius",
    "window_corner_divisions": "Window Corner Divisions",
    "preview": "Preview"
  },
  "ja": {
    "blocks": "ブロック",
    "door_width": "ドア幅",
    "door_height": "ドア高さ",
    "door_thickness": "ドア厚み",
    "door_z_offset": "ドアZ",
    "base_color": "ベースカラー",
    "rubber_thickness": "戸先ゴム厚み",
    "rubber_color": "戸先ゴムカラー",
    "window_x_offset": "窓X",
    "window_y_offset": "窓Y",
    "window_width": "窓幅",
    "window_height": "窓高さ",
    "window_corner_radius": "窓角丸",
    "window_corner_divisions": "窓角分割数",
    "preview": "プレビュー"
  }
}
</i18n>
