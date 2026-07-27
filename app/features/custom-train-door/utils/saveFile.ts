import {
  buildDoorGeometry,
  getFilenames,
  createVisualComponent,
  createLuaScript,
  createCollisionComponent,
  type DoorUnitFileNameSet,
  createStaticComponent,
} from '../doorTypes';
import type { TrainDoorOptions, OutputTrainDoorState } from '../types';

export function createMeshFiles(
  state: DeepReadonly<OutputTrainDoorState>,
  fingerprint: string,
  meshNames?: Record<string, string>,
) {
  const filenames = meshNames ?? getFilenames(state.options, fingerprint).meshes ?? {};

  const objects = buildDoorGeometry(state, { refine: true });

  return objects.map(({ id, builder }) => {
    const data = builder.toMeshData();

    const filename = filenames[id];
    if (filename === undefined)
      throw new Error(`Unexpected Error: No mesh filename found for id "${id}".`);

    return { filename, data, mimetype: 'application/octet-stream' };
  });
}

export function createMergedMeshFile(
  state: DeepReadonly<OutputTrainDoorState>,
  fingerprint: string,
  filename?: string,
) {
  filename = filename ?? getFilenames(state.options, fingerprint).mergedMesh;

  const objects = buildDoorGeometry(state, { refine: true });

  const builder = new GeometryBuilder();
  for (const object of objects) {
    builder.merge(object.builder);
  }

  return {
    filename,
    data: builder.toMeshData(),
    mimetype: 'application/octet-stream',
  };
}

export function createVisualComponentFiles(
  state: DeepReadonly<OutputTrainDoorState>,
  fingerprint: string,
  filenames?: DeepReadonly<DoorUnitFileNameSet>,
) {
  filenames = filenames ?? getFilenames(state.options, fingerprint);
  const definition = createVisualComponent(state.options, fingerprint, filenames);
  const script = createLuaScript(state.options);

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
    meshes: createMeshFiles(state, fingerprint, filenames.meshes),
  };
}

export function createCollisionComponentFile(
  options: DeepReadonly<TrainDoorOptions>,
  fingerprint: string,
  filename?: string,
) {
  filename = filename ?? getFilenames(options, fingerprint).collisionDefinition;
  const definition = createCollisionComponent(options, fingerprint);

  return {
    filename,
    data: definition,
    mimetype: 'application/xml',
  };
}

export function createStaticComponentFiles(
  state: DeepReadonly<OutputTrainDoorState>,
  fingerprint: string,
  filenames?: DeepReadonly<DoorUnitFileNameSet>,
) {
  filenames = filenames ?? getFilenames(state.options, fingerprint);
  const definition = createStaticComponent(state.options, fingerprint, filenames);

  const mesh = createMergedMeshFile(state, fingerprint, filenames.mergedMesh);

  return {
    definition: {
      filename: filenames.visualDefinition,
      data: definition,
      mimetype: 'application/xml',
    },
    mesh,
  };
}
