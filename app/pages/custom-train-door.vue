<script setup lang="ts">
import { computed, ref } from 'vue';

useHead({ title: 'Polygon editor playground' });
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
</script>

<template>
  <UContainer class="grow py-4">
    <div class="space-y-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold">
          Polygon editor playground
        </h1>
        <p class="text-sm text-muted">
          埋め込み用コンポーネントの初期実装です。親側とは v-model で接続できます。
        </p>
      </div>

      <PolygonEditor
        v-model="editorValue"
        :logical-width="3"
        :logical-height="8"
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
