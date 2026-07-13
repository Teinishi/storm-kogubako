<script setup lang="ts">
import type {
  PolygonEditorValue,
} from '../utils/polygonEditorCore';
import { usePolygonEditor } from '~/composables/usePolygonEditor';
import { providePolygonEditor } from '~/composables/useEditorContext';

const props = withDefaults(defineProps<{
  logicalBounds: { width: number; height: number };
  disabled?: boolean;
  readonly?: boolean;
}>(), {
  logicalWidth: undefined,
  logicalHeight: undefined,
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  (event: 'change', value: PolygonEditorValue): void;
}>();

const model = defineModel<PolygonEditorValue>({ required: true });

const canvasRef = useTemplateRef('canvas');

const editor = usePolygonEditor({
  props,
  model,
  emitChange: snapshot => emit('change', snapshot),
  renderCanvas: () => { canvasRef.value?.renderCanvas(); },
});

providePolygonEditor(editor);

watch(props, () => {
  canvasRef.value?.renderCanvas();
});
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-4">
    <PolygonEditorCanvas
      ref="canvas"
      class="min-h-80 max-h-[80vh] lg:flex-1"
    />
    <PolygonEditorSidebar class="lg:overflow-y-scroll lg:w-88" />
  </div>
</template>
