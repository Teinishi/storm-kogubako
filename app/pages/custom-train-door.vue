<script setup lang="ts">
import { computed, ref } from 'vue';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });

const editorValue = ref({
  backgroundColor: '#F8FAFC',
  grid: {
    enabled: true,
    minorDivisions: 4,
  },
  polygons: [],
});

const serializedValue = computed(() => JSON.stringify(editorValue.value, null, 2));

const doorWidth = ref(3);
const doorHeight = ref(8);
</script>

<template>
  <UContainer class="grow py-4">
    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
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

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          返却される状態
        </div>
        <pre class="max-h-64 overflow-auto rounded-lg bg-gray-950 p-3 text-xs text-gray-100">{{ serializedValue }}</pre>
      </div>
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
