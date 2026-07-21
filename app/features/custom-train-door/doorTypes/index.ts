import type { Reactive } from 'vue';
import type { RenderHooks, PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import * as doubleSliding from './doubleSliding';
import * as singleSlidingLeft from './singleSlidingLeft';
import * as singleSlidingRight from './singleSlidingRight';

export interface RenderHooksSet {
  outside: RenderHooks;
  inside: RenderHooks;
}

export function createRenderHooks(state: Reactive<TrainDoorState>): RenderHooksSet {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.createRenderHooks(state);
    case 'single_sliding_left':
      return singleSlidingLeft.createRenderHooks(state);
    case 'single_sliding_right':
      return singleSlidingRight.createRenderHooks(state);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function buildDoorGeometry(
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorValue>,
  insidePaint: DeepReadonly<PolygonEditorValue>,
  builderOptions?: DeepReadonly<GeometryBuilderOptions>,
) {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.buildGeometry(state, outsidePaint, insidePaint, builderOptions);
    case 'single_sliding_left':
      return singleSlidingLeft.buildGeometry(state, outsidePaint, insidePaint, builderOptions);
    case 'single_sliding_right':
      return singleSlidingRight.buildGeometry(state, outsidePaint, insidePaint, builderOptions);
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

export function getFilenames(state: DeepReadonly<TrainDoorState>, fingerprint: string): DoorUnitFileNameSet {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.getFilenames(state, fingerprint);
    case 'single_sliding_left':
      throw new Error('Unimplemented');
    case 'single_sliding_right':
      throw new Error('Unimplemented');
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createVisualComponent(state: DeepReadonly<TrainDoorState>, fingerprint: string, filenames: DeepReadonly<DoorUnitFileNameSet>) {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.createVisualComponent(state, fingerprint, filenames);
    case 'single_sliding_left':
      throw new Error('Unimplemented');
    case 'single_sliding_right':
      throw new Error('Unimplemented');
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createLuaScript(state: DeepReadonly<TrainDoorState>) {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.createLuaScript(state);
    case 'single_sliding_left':
      return singleSlidingLeft.createLuaScript(state);
    case 'single_sliding_right':
      return singleSlidingRight.createLuaScript(state);
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}

export function createCollisionComponent(state: DeepReadonly<TrainDoorState>, fingerprint: string) {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.createCollisionComponent(state, fingerprint);
    case 'single_sliding_left':
      throw new Error('Unimplemented');
    case 'single_sliding_right':
      throw new Error('Unimplemented');
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
    case 'double_sliding':
      return doubleSliding.createDoorUnitVehicle(state, visualComponentName, collisionComponentName);
    case 'single_sliding_left':
      throw new Error('Unimplemented');
    case 'single_sliding_right':
      throw new Error('Unimplemented');
    default:
      doorType satisfies never;
      throw new Error('Unreachable');
  }
}
