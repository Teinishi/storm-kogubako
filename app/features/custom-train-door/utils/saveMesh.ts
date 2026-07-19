import type { PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { buildDoorGeometry } from '../doorTypes';

export function saveMesh(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorValue>,
  insidePaint: DeepReadonly<PolygonEditorValue>,
) {
  const objects = buildDoorGeometry(state, outsidePaint, insidePaint, { refine: true });

  for (const { id, builder } of objects) {
    saveFile(builder.createMeshFile(), `train_door_${id}.mesh`);
  }
}

function saveFile(data: BlobPart, name: string) {
  const blob = new Blob([data], {
    type: 'application/octet-stream',
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}
