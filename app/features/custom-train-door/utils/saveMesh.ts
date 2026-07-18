import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import type { TrainDoorState } from '../types/TrainDoorState';
import { buildDoorGeometry } from '../doorTypes';

export function saveMesh(
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
  insidePaint: Readonly<PolygonEditorValue>,
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
