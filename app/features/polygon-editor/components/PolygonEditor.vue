<script setup lang="ts">
import { usePolygonEditor, providePolygonEditor } from '../composables';
import type { LogicalBounds, PolygonEditorValue, RenderHooks } from '../types';
import type { PolygonEditorGrid } from '../utils';
import PolygonEditorCanvas from './PolygonEditorCanvas.client.vue';
import PolygonEditorSidebar from './PolygonEditorSidebar.vue';

const props = withDefaults(
  defineProps<{
    logicalBounds: LogicalBounds;
    disabled?: boolean;
    readonly?: boolean;
    renderHooks?: RenderHooks;
  }>(),
  {
    disabled: false,
    readonly: false,
    renderHooks: undefined,
  },
);

const emit = defineEmits<{
  (event: 'change', value: PolygonEditorValue): void;
}>();

const gridEnabled = defineModel<boolean>('gridEnabled', { default: true });
const gridMiniorDivisions = defineModel<number>('gridMiniorDivision', { default: 9 });
const model = defineModel<PolygonEditorValue>({ required: true });

const grid = computed<PolygonEditorGrid>(() => ({
  enabled: gridEnabled.value,
  minorDivisions: gridMiniorDivisions.value,
}));

const canvasRef = useTemplateRef('canvas');

function renderCanvas() {
  canvasRef.value?.renderCanvas();
}

const editor = usePolygonEditor({
  props,
  grid,
  model,
  emitChange: (snapshot) => emit('change', snapshot),
  renderCanvas,
});

providePolygonEditor(editor);

watch([props, gridEnabled, gridMiniorDivisions], renderCanvas);

defineExpose({ renderCanvas });
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row">
    <ClientOnly>
      <PolygonEditorCanvas
        ref="canvas"
        class="max-h-[80vh] min-h-80 lg:max-h-none lg:flex-1"
        :render-hooks="renderHooks"
      />
    </ClientOnly>
    <PolygonEditorSidebar
      v-model:grid-enabled="gridEnabled"
      v-model:grid-minior-divisions="gridMiniorDivisions"
      class="lg:w-88 lg:overflow-y-scroll"
    />
  </div>
</template>
