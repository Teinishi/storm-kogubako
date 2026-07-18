import type { Reactive } from 'vue';
import type { RenderHooks } from '~/features/polygon-editor/types/render';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import type { TrainDoorState } from '../types/TrainDoorState';
import { drawBackground } from '../utils/renderHook.client';
import { drawWindowsOnCanvas, getSingleWindowPolygon } from '../doorWindow/basic';
import { buildSlidingDoorGeometry } from '../utils/geometry';
import type { RenderHooksSet } from '.';

function getBaseRect(state: Readonly<TrainDoorState>): Rect {
  const rubber = state.rubberThickness / 0.25;
  return normalizeRect({
    x: rubber,
    y: 0,
    width: state.doorWidth - rubber,
    height: state.doorHeight,
  });
}

function getWindowRings(state: Readonly<TrainDoorState>, flip?: boolean) {
  const options = {
    windowSize: { x: state.windowWidth / 0.25, y: state.windowHeight / 0.25 },
    offset: { x: state.windowXOffset / 0.25, y: state.windowYOffset / 0.25 },
    radius: state.windowCornerRadius / 0.25,
    segments: state.windowCornerDivisions,
    flip,
    flipWidth: state.doorWidth,
  };

  return getSingleWindowPolygon(getBaseRect(state), options);
}

function createRenderHook(state: Reactive<TrainDoorState>, isInside: boolean): RenderHooks {
  return {
    onBeforeRenderPolygons(args) {
      drawBackground(args, state, isInside);
    },
    onBeforeRenderSelection(args) {
      const { editor, ctx } = args;
      const hasSelection = editor.selectedPolygonId.value !== null;
      ctx.globalAlpha = hasSelection ? 0.6 : 1;

      drawWindowsOnCanvas(args, [getWindowRings(state, isInside)]);

      // 戸先ゴム描画
      const rubber = state.rubberThickness / 0.25;
      ctx.fillStyle = state.rubberColor;
      const r = args.worldRectToCanvas(isInside
        ? {
            x: state.doorWidth,
            y: 0,
            width: -rubber,
            height: state.doorHeight,
          }
        : {
            x: 0,
            y: 0,
            width: rubber,
            height: state.doorHeight,
          });
      ctx.fillRect(r.x, r.y, r.width, r.height);
    },
  };
}

export function createRenderHooks(state: Reactive<TrainDoorState>): RenderHooksSet {
  return {
    outside: createRenderHook(state, false),
    inside: createRenderHook(state, true),
  };
}

export function buildGeometry(
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
  insidePaint: Readonly<PolygonEditorValue>,
) {
  const builder = new GeometryBuilder();

  buildSlidingDoorGeometry(builder, {
    baseRect: getBaseRect(state),
    outsidePaint,
    insidePaint,
    doorSize: { x: state.doorWidth, y: state.doorHeight },
    frontZ: state.doorThickness / 2 + state.doorZOffset,
    backZ: -state.doorThickness / 2 + state.doorZOffset,
    frontColor: hexToRgb(state.outsideColor),
    backColor: hexToRgb(state.insideColor),
    direction: 'right',
    rubberThickness: state.rubberThickness / 0.25,
    rubberColor: hexToRgb(state.rubberColor),
    windowRings: [getWindowRings(state)],
  });

  return [{ id: 'main', builder }];
}
