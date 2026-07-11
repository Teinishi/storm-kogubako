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
  <div class="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
    <PolygonEditorSidebar class="overflow-y-scroll" />
    <PolygonEditorCanvas ref="canvas" />
  </div>
</template>
