import { reactive } from 'vue';
import { createDefaultPolygonEditorValue, type PolygonEditorValue } from '~/features/polygon-editor';
import { type TrainDoorState, createDefaultTrainDoorState } from '../types';
import { createRenderHooks } from '../doorTypes';

export function useCustomTrainDoor() {
  const state = reactive<TrainDoorState>(createDefaultTrainDoorState());

  const outsidePolygonEditorValue = ref<PolygonEditorValue>(createDefaultPolygonEditorValue());
  const insidePolygonEditorValue = ref<PolygonEditorValue>(createDefaultPolygonEditorValue());

  const editorLogicalBounds = computed(() => ({
    width: state.doorWidth,
    height: state.doorHeight,
  }));

  const polygonEditorProps = computed(() => {
    const { outside, inside } = createRenderHooks(state);
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
    state,
    outsidePolygonEditorValue,
    insidePolygonEditorValue,
    outsideEditorProps,
    insideEditorProps,
  };
}
