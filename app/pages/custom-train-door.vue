<script setup lang="ts">
import { ref } from 'vue';
import { polygonsToDisjointTriangles } from '~/utils/polygonUtils';
import { BufferGeometry } from 'three';

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

watchEffect(() => {
  const { polygons, backgroundColor } = editorValue.value;
  const rect = { x: 0, y: 0, width: doorWidth.value, height: doorHeight.value };
  const triangulated = polygonsToDisjointTriangles(polygons, rect);
  updateGeometry(
    geometry,
    triangulated,
    ({ id }) => hexToRgb(polygons.find(v => v.id === id)?.color ?? backgroundColor),
  );
});
</script>

<template>
  <UContainer class="grow py-4 grid sm:grid-cols-[600px_1fr] gap-4">
    <div class="flex flex-col gap-4 overflow-y-auto">
      <h1 class="text-2xl font-bold">
        {{ gt('custom_train_door') }}
      </h1>

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

      <PolygonEditor
        v-model="editorValue"
        :logical-bounds="{ width: doorWidth, height: doorHeight }"
        :style="{ height: '600px' }"
      />
    </div>

    <div>
      <ClientOnly>
        <MeshViewerCanvas>
          <TresMesh :geometry="geometry">
            <TresMeshStandardMaterial :vertex-colors="true" />
          </TresMesh>
        </MeshViewerCanvas>
      </ClientOnly>
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "door_width": "Door Width",
    "door_height": "Door Height"
  },
  "ja": {
    "door_width": "ドア幅",
    "door_height": "ドア高さ"
  }
}
</i18n>
