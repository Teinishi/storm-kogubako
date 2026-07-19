import type { Reactive } from 'vue';
import type { RenderHooks, PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { drawBackground, buildSlidingDoorGeometry } from '../utils';
import { drawWindowsOnCanvas, getSingleWindowPolygon } from '../doorWindow/basic';
import type { RenderHooksSet } from '.';

function getBaseRect(state: DeepReadonly<TrainDoorState>): Rect {
  const rubber = state.rubberThickness / 0.25;
  return normalizeRect({
    x: rubber,
    y: 0,
    width: state.doorWidth - rubber,
    height: state.doorHeight,
  });
}

function getWindowRings(state: DeepReadonly<TrainDoorState>, flip?: boolean) {
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
  state: DeepReadonly<TrainDoorState>,
  outsidePaint: DeepReadonly<PolygonEditorValue>,
  insidePaint: DeepReadonly<PolygonEditorValue>,
  builderOptions?: DeepReadonly<GeometryBuilderOptions>,
) {
  const builder = new GeometryBuilder(builderOptions);

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

export function createLuaScript(
  state: DeepReadonly<TrainDoorState>,
) {
  const motionRange = state.doorWidth * 0.25;

  const script = `local MOTION_RANGE = ${motionRange}

local transform = matrix.identity()

function onTick()
  local value, success = component.getInputLogicSlotFloat(0)
  if success then
    local x = MOTION_RANGE * math.min(math.max(value, 0), 1)
    transform = matrix.translation(0, 0, -x)
  end
end

function onRender()
  component.renderMesh0(transform)
end
`;

  return script;
}
