import type { Matrix4 } from 'three';
import type { Reactive } from 'vue';
import type { RenderHooks } from '~/features/polygon-editor';
import type { OutputTrainDoorState, TrainDoorOptions } from '../types';
import * as sliding from './sliding';

export interface RenderHooksSet {
  outside: RenderHooks;
  inside: RenderHooks;
}

export function createRenderHooks(options: Reactive<TrainDoorOptions>): RenderHooksSet {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createRenderHooks(options);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function buildDoorGeometry(
  state: DeepReadonly<OutputTrainDoorState>,
  builderOptions?: DeepReadonly<GeometryBuilderOptions>,
) {
  const { doorType } = state.options;
  switch (doorType) {
    case 'sliding':
      return sliding.buildGeometry(state, builderOptions);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function getDoorGeometryTransform(
  options: DeepReadonly<TrainDoorOptions>,
  t: number,
): Record<string, Matrix4> {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.getDoorGeometryTransform(options, t);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export interface DoorUnitFileNameSet {
  doorUnitVehicleName: string;
  staticUnitVehicleName: string;
  visualDefinition: string;
  script: string;
  meshes: Record<string, string>;
  mergedMesh: string;
  collisionDefinition: string;
  meshesZip: string;
  visualComponentZip: string;
}

export function getFilenames(
  options: DeepReadonly<TrainDoorOptions>,
  fingerprint: string,
): DoorUnitFileNameSet {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.getFilenames(options, fingerprint);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createVisualComponent(
  options: DeepReadonly<TrainDoorOptions>,
  fingerprint: string,
  filenames: DeepReadonly<DoorUnitFileNameSet>,
) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createVisualComponent(options, fingerprint, filenames);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createLuaScript(options: DeepReadonly<TrainDoorOptions>) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createLuaScript(options);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createCollisionComponent(
  options: DeepReadonly<TrainDoorOptions>,
  fingerprint: string,
) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createCollisionComponent(options, fingerprint);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createStaticComponent(
  options: DeepReadonly<TrainDoorOptions>,
  fingerprint: string,
  filenames: DeepReadonly<DoorUnitFileNameSet>,
) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createStaticComponent(options, fingerprint, filenames);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createDoorUnitVehicle(
  options: DeepReadonly<TrainDoorOptions>,
  visualComponentName: string,
  collisionComponentName: string,
) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createDoorUnitVehicle(options, visualComponentName, collisionComponentName);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createStaticUnitVehicle(
  options: DeepReadonly<TrainDoorOptions>,
  staticComponentName: string,
) {
  const { doorType } = options;
  switch (doorType) {
    case 'sliding':
      return sliding.createStaticUnitVehicle(options, staticComponentName);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}
