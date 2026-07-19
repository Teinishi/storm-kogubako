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
