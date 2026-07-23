import { createRenderHooks } from '../doorTypes';
import type { EditTrainDoorState } from '../types';

export function useCustomTrainDoor(state: Ref<EditTrainDoorState>) {
  const editorLogicalBounds = computed(() => ({
    minX: 0,
    minY: 0,
    maxX: state.value.options.doorWidth,
    maxY: state.value.options.doorHeight,
  }));

  const polygonEditorProps = computed(() => {
    const { outside, inside } = createRenderHooks(state.value.options);
    return {
      outside: {
        logicalBounds: editorLogicalBounds.value,
        renderHooks: outside,
      },
      inside: {
        logicalBounds: editorLogicalBounds.value,
        renderHooks: inside,
      },
    };
  });

  const outsideEditorProps = computed(() => polygonEditorProps.value.outside);
  const insideEditorProps = computed(() => polygonEditorProps.value.inside);

  return {
    outsideEditorProps,
    insideEditorProps,
    editorLogicalBounds,
  };
}
