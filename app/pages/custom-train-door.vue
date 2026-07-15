<script setup lang="ts">
import { ref } from 'vue';
import type { PolygonEditorValue } from '~/utils/polygonEditorCore';
import type { RenderHooks } from '~/composables/usePolygonEditorCanvas';

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

const tabItems = computed(() => [
  {
    label: t('settings'),
    icon: 'i-lucide-wrench',
    slot: 'settings' as const,
  },
  {
    label: t('outside_paint'),
    slot: 'outside' as const,
  },
]);

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
    ctx.globalAlpha = 1;
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

      <div class="grow px-4 pt-0 pb-18 sm:pb-4 min-h-0">
        <UTabs
          :items="tabItems"
          :unmount-on-hide="false"
          :ui="{ root: 'gap-4', content: 'grow min-h-0' }"
          class="h-full"
        >
          <template #settings>
            <TrainDoorState v-model="state" />
          </template>

          <template #outside>
            <PolygonEditor
              ref="polygonEditor"
              v-model="polygonEditorValue"
              :logical-bounds="{ width: state.doorWidth, height: state.doorHeight }"
              :render-hooks="renderHooks"
              class="h-full overflow-y-auto"
            />
          </template>
        </UTabs>
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
    "settings": "Settings",
    "outside_paint": "Outside Paint",
    "inside_paint": "Inside Paint",
    "preview": "Preview"
  },
  "ja": {
    "settings": "設定",
    "outside_paint": "外側ペイント",
    "inside_paint": "内側ペイント",
    "preview": "プレビュー"
  }
}
</i18n>
