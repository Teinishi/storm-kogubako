<script setup lang="ts">
import PolygonEditorCanvas from './PolygonEditorCanvas.client.vue';
import PolygonEditorSidebar from './PolygonEditorSidebar.vue';
import { usePolygonEditor } from '../composables/usePolygonEditor';
import { providePolygonEditor } from '../composables/usePolygonEditorContext';
import type { PolygonEditorValue } from '../types/modelValue';
import type { RenderHooks } from '../types/render';
import type { PolygonEditorGrid } from '../utils/grid';

const props = withDefaults(defineProps<{
  logicalBounds: { width: number; height: number };
  disabled?: boolean;
  readonly?: boolean;
  renderHooks?: RenderHooks;
}>(), {
  disabled: false,
  readonly: false,
});

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
  emitChange: snapshot => emit('change', snapshot),
  renderCanvas,
});

providePolygonEditor(editor);

watch([props, gridEnabled, gridMiniorDivisions], renderCanvas);

defineExpose({ renderCanvas });
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4">
    <ClientOnly>
      <PolygonEditorCanvas
        ref="canvas"
        class="min-h-80 max-h-[80vh] lg:max-h-none lg:flex-1"
        :render-hooks="renderHooks"
      />
    </ClientOnly>
    <PolygonEditorSidebar
      v-model:grid-enabled="gridEnabled"
      v-model:grid-minior-divisions="gridMiniorDivisions"
      class="lg:overflow-y-scroll lg:w-88"
    />
  </div>
</template>
