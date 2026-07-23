import type { Reactive } from 'vue';
import type { RenderHooks, PolygonEditorPolygon } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import * as doubleSliding from './doubleSliding';

export interface RenderHooksSet {
  outside: RenderHooks;
  inside: RenderHooks;
}

export function createRenderHooks(state: Reactive<TrainDoorState>): RenderHooksSet {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.createRenderHooks(state);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function buildDoorGeometry(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  insidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  builderOptions?: DeepReadonly<GeometryBuilderOptions>,
) {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.buildGeometry(state, outsidePaint, insidePaint, builderOptions);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export interface DoorUnitFileNameSet {
  doorUnitVehicleName: string;
  visualDefinition: string;
  script: string;
  meshes: Record<string, string>;
  collisionDefinition: string;
  meshesZip: string;
  visualComponentZip: string;
}

export function getFilenames(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
): DoorUnitFileNameSet {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.getFilenames(state, fingerprint);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createVisualComponent(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
  filenames: DeepReadonly<DoorUnitFileNameSet>,
) {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.createVisualComponent(state, fingerprint, filenames);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createLuaScript(state: DeepReadonly<TrainDoorState>) {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.createLuaScript(state);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createCollisionComponent(state: DeepReadonly<TrainDoorState>, fingerprint: string) {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.createCollisionComponent(state, fingerprint);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createDoorUnitVehicle(
  state: DeepReadonly<TrainDoorState>,
  visualComponentName: string,
  collisionComponentName: string,
) {
  const { doorType } = state;
  switch (doorType) {
    case 'sliding':
      return doubleSliding.createDoorUnitVehicle(
        state,
        visualComponentName,
        collisionComponentName,
      );
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}
