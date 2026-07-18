import { reactive } from 'vue';
import { getWindowPolygon } from '../utils/customTrainDoor.client';
import type { TrainDoorState } from '../types/TrainDoorState';
import { createDefaultTrainDoorState } from '../types/TrainDoorState';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import { createRenderHooks } from '../doorTypes';

export function useCustomTrainDoor(
  _renderOutsideEditor: () => void,
  _renderInsideEditor: () => void,
) {
  const state = reactive<TrainDoorState>(createDefaultTrainDoorState());

  const outsidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });
  const insidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });

  const editorLogicalBounds = computed(() => ({
    width: state.doorWidth,
    height: state.doorHeight,
  }));

  const windowPolygon = computed(() => getWindowPolygon(state));

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

  // watch(windowPolygon, renderOutsideEditor);
  // watch(windowPolygon, renderInsideEditor);

  return {
    state,
    windowPolygon,
    outsidePolygonEditorValue,
    insidePolygonEditorValue,
    outsideEditorProps,
    insideEditorProps,
  };
}
