import type { PolygonEditorPolygon } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { buildDoorGeometry, getFilenames, createVisualComponent, createLuaScript, createCollisionComponent, type DoorUnitFileNameSet } from '../doorTypes';

export function createMeshFiles(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  insidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  fingerprint: string,
  meshNames?: Record<string, string>,
) {
  const filenames = meshNames ?? getFilenames(state, fingerprint).meshes ?? {};

  const objects = buildDoorGeometry(state, outsidePaint, insidePaint, { refine: true });

  return objects.map(({ id, builder }) => {
    builder.transform(Orientation.RotateY270);
    const data = builder.toMeshData();

    const filename = filenames[id];
    if (filename === undefined) throw new Error(`Unexpected Error: No mesh filename found for id "${id}".`);

    return { filename, data, mimetype: 'application/octet-stream' };
  });
}

export function createVisualComponentFiles(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  insidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  fingerprint: string,
  filenames?: DeepReadonly<DoorUnitFileNameSet>,
) {
  filenames = filenames ?? getFilenames(state, fingerprint);
  const definition = createVisualComponent(state, fingerprint, filenames);
  const script = createLuaScript(state);

  return {
    definition: {
      filename: filenames.visualDefinition,
      data: definition,
      mimetype: 'application/xml',
    },
    script: {
      filename: filenames.script,
      data: script,
      mimetype: 'text/plain',
    },
    meshes: createMeshFiles(state, outsidePaint, insidePaint, fingerprint, filenames.meshes),
  };
}

export function createCollisionComponentFile(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
  filename?: string,
) {
  filename = filename ?? getFilenames(state, fingerprint).collisionDefinition;
  const definition = createCollisionComponent(state, fingerprint);

  return {
    filename,
    data: definition,
    mimetype: 'application/xml',
  };
}
