import type { PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { buildDoorGeometry } from '../doorTypes';

export function createMeshFiles(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorValue>,
  insidePaint: DeepReadonly<PolygonEditorValue>,
) {
  const objects = buildDoorGeometry(state, outsidePaint, insidePaint, { refine: true });

  return objects.map(({ id, builder }) => ({
    id,
    data: builder.createMeshFile(),
  }));
}
