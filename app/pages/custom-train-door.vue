<script setup lang="ts">
import { ref } from 'vue';
import polygonClipping from 'polygon-clipping';
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';
import { polygonToGeom, rectToGeom, polygonsToDisjointTriangles } from '~/utils/polygonUtils';
import type { RenderHooks } from '~/composables/usePolygonEditorCanvas';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });

const UNITS_PER_BLOCK = 9;
const FORMAT_OPTIONS_METER = { maximumFractionDigits: 5, style: 'unit', unit: 'meter' } as const;

const polygonEditor = useTemplateRef('polygonEditor');

const doorWidth = ref(3);
const doorHeight = ref(8);
const doorThickness = ref(0.1);
const baseColor = ref('#c0c7cf');
const rubberThickness = ref(1);
const rubberColor = ref('#9B9B9B');

const windowXOffset = ref(0);
const windowYOffset = ref(0.125);
const windowWidth = ref(0.5);
const windowHeight = ref(1);
const windowCornerRadius = ref(0.08);
const windowCornerDivisions = ref(1);

const windowRect = computed(() => {
  const wBlocks = windowWidth.value / 0.25;
  const hBlocks = windowHeight.value / 0.25;
  const x = (doorWidth.value - wBlocks) / 2 + windowXOffset.value / 0.25;
  const top = doorHeight.value - windowYOffset.value / 0.25;
  return {
    x,
    y: top - hBlocks,
    width: wBlocks,
    height: hBlocks,
  };
});

const windowPolygon = computed(() => createRoundedRectPolygon(
  windowRect.value,
  windowCornerRadius.value / 0.25,
  windowCornerDivisions.value,
));

const editorValue = ref<PolygonEditorValue>({ polygons: [] });

const renderHooks: RenderHooks = {
  onBeforeRenderPolygons({ ctx, worldRectToCanvas }) {
    // ベースカラー描画
    const r = worldRectToCanvas({ x: 0, y: 0, width: doorWidth.value, height: doorHeight.value });
    ctx.fillStyle = baseColor.value;
    ctx.fillRect(r.x, r.y, r.width, r.height);
  },
  onBeforeRenderSelection({ editor, ctx, worldToCanvas }) {
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

    ctx.fillStyle = '#9B9B9B';
    ctx.beginPath();
    polygonOnCanvas(ctx, points, worldToCanvas);
    polygonOnCanvas(ctx, outerRing, worldToCanvas);
    ctx.closePath();
    ctx.fill('evenodd');
  },
};

watch(windowPolygon, () => {
  polygonEditor.value?.renderCanvas();
});

const geometry = new BufferGeometry();
const materials = createStormworksMaterials();

watchEffect(() => {
  const rectGeom = rectToGeom({ x: 0, y: 0, width: doorWidth.value, height: doorHeight.value });
  const windowHole = polygonToGeom(offsetPolygon(windowPolygon.value, 0.02 / 0.25));
  const baseGeom = polygonClipping.difference(rectGeom, windowHole);

  const { polygons } = editorValue.value;
  const triangulated = polygonsToDisjointTriangles(polygons, baseGeom);
  updateGeometry(
    geometry,
    triangulated,
    ({ id }) => hexToRgb(polygons.find(v => v.id === id)?.color ?? baseColor.value),
    ({ x, y }) => ({
      x: 0.25 * (x - Math.floor(doorWidth.value / 2) - 0.5),
      y: 0.25 * (y - Math.floor(doorHeight.value / 2) - 0.5),
      z: 0,
    }),
  );
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
                    v-model="doorWidth"
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
                    v-model="doorHeight"
                    :step="1"
                    :min="1"
                    class="flex-1"
                  />
                  <span class="text-muted">{{ t('blocks') }}</span>
                </div>
              </UFormField>

              <UFormField :label="t('door_thickness')">
                <UInputNumber
                  v-model="doorThickness"
                  :step="0.05"
                  :min="0.05"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('rubber_thickness')">
                <div class="flex items-center gap-2">
                  <UInputNumber
                    v-model="rubberThickness"
                    :step="1"
                    :min="1"
                    class="flex-1"
                  />
                  <span class="text-muted">/ {{ UNITS_PER_BLOCK }}</span>
                </div>
              </UFormField>

              <ColorPicker
                v-model="baseColor"
                :label="t('base_color')"
              />

              <ColorPicker
                v-model="rubberColor"
                :label="t('rubber_color')"
              />
            </div>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <UFormField :label="t('window_x_offset')">
                <UInputNumber
                  v-model="windowXOffset"
                  :step="0.0625"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_y_offset')">
                <UInputNumber
                  v-model="windowYOffset"
                  :step="0.0625"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_width')">
                <UInputNumber
                  v-model="windowWidth"
                  :step="0.0625"
                  :min="0"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_height')">
                <UInputNumber
                  v-model="windowHeight"
                  :step="0.0625"
                  :min="0"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_corner_radius')">
                <UInputNumber
                  v-model="windowCornerRadius"
                  :step="0.01"
                  :min="0"
                  class="flex-1"
                  :format-options="FORMAT_OPTIONS_METER"
                />
              </UFormField>

              <UFormField :label="t('window_corner_divisions')">
                <UInputNumber
                  v-model="windowCornerDivisions"
                  :step="1"
                  :min="0"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </div>

        <div class="flex-1 lg:min-h-0">
          <PolygonEditor
            ref="polygonEditor"
            v-model="editorValue"
            :logical-bounds="{ width: doorWidth, height: doorHeight }"
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
        <MeshViewerCanvas>
          <TresMesh
            :geometry="geometry"
            :material="[materials.opaque, materials.glass, materials.additive]"
          />
        </MeshViewerCanvas>
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
    "base_color": "ベースカラー",
    "rubber_thickness": "戸先ゴム厚み",
    "rubber_color": "戸先ゴムカラー",
    "window_x_offset": "窓Xオフセット",
    "window_y_offset": "窓Yオフセット",
    "window_width": "窓幅",
    "window_height": "窓高さ",
    "window_corner_radius": "窓角丸",
    "window_corner_divisions": "窓角分割数",
    "preview": "プレビュー"
  }
}
</i18n>
