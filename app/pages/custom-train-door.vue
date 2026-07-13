<script setup lang="ts">
import { ref } from 'vue';
import { polygonsToDisjointTriangles } from '~/utils/polygonUtils';
import { BufferGeometry } from 'three';
import { createStormworksMaterials } from 'sw-mesh-viewer/viewer';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });

const doorWidth = ref(3);
const doorHeight = ref(8);

const editorValue = ref<PolygonEditorValue>({
  backgroundColor: '#F8FAFC',
  grid: {
    enabled: true,
    minorDivisions: 4,
  },
  polygons: [],
});

const geometry = new BufferGeometry();
const materials = createStormworksMaterials();

watchEffect(() => {
  const { polygons, backgroundColor } = editorValue.value;
  const rect = { x: 0, y: 0, width: doorWidth.value, height: doorHeight.value };
  const triangulated = polygonsToDisjointTriangles(polygons, rect);
  updateGeometry(
    geometry,
    triangulated,
    ({ id }) => hexToRgb(polygons.find(v => v.id === id)?.color ?? backgroundColor),
    ({ x, y }) => ({
      x: 0.25 * (x - doorWidth.value / 2),
      y: 0.25 * (y - doorHeight.value / 2),
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <UFormField :label="t('door_width')">
                <UInputNumber
                  v-model="doorWidth"
                  :step="1"
                  :min="1"
                />
              </UFormField>

              <UFormField :label="t('door_height')">
                <UInputNumber
                  v-model="doorHeight"
                  :step="1"
                  :min="1"
                />
              </UFormField>
            </div>
          </div>

          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4" />
        </div>

        <div class="flex-1 lg:min-h-0">
          <PolygonEditor
            v-model="editorValue"
            :logical-bounds="{ width: doorWidth, height: doorHeight }"
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
    "door_width": "Door Width",
    "door_height": "Door Height",
    "preview": "Preview"
  },
  "ja": {
    "door_width": "ドア幅",
    "door_height": "ドア高さ",
    "preview": "プレビュー"
  }
}
</i18n>
