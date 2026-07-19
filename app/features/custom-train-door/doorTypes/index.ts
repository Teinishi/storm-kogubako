import type { RenderHooks, PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import * as doubleSliding from './doubleSliding';
import * as singleSlidingLeft from './singleSlidingLeft';
import * as singleSlidingRight from './singleSlidingRight';

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export interface RenderHooksSet {
  outside: RenderHooks;
  inside: RenderHooks;
}

export function createRenderHooks(state: TrainDoorState): RenderHooksSet {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.createRenderHooks(state);
    case 'single_sliding_left':
      return singleSlidingLeft.createRenderHooks(state);
    case 'single_sliding_right':
      return singleSlidingRight.createRenderHooks(state);
    default:
      assertNever(doorType);
  }
}

export function buildDoorGeometry(
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
  insidePaint: Readonly<PolygonEditorValue>,
  builderOptions?: Readonly<GeometryBuilderOptions>,
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
      assertNever(doorType);
  }
}
