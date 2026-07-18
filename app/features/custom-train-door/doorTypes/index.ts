import type { RenderHooks } from '~/features/polygon-editor/types/render';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import type { TrainDoorState } from '../types/TrainDoorState';
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

export function buildGeometry(
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
  insidePaint: Readonly<PolygonEditorValue>,
) {
  const { doorType } = state;
  switch (doorType) {
    case 'double_sliding':
      return doubleSliding.buildGeometry(state, outsidePaint, insidePaint);
    case 'single_sliding_left':
      return singleSlidingLeft.buildGeometry(state, outsidePaint, insidePaint);
    case 'single_sliding_right':
      return singleSlidingRight.buildGeometry(state, outsidePaint, insidePaint);
    default:
      assertNever(doorType);
  }
}
