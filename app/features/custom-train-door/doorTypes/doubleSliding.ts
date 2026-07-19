import type { Reactive } from 'vue';
import type { RenderHooks, PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';
import { drawBackground, buildSlidingDoorGeometry } from '../utils';
import { drawWindowsOnCanvas, getSingleWindowPolygon } from '../doorWindow/basic';
import type { RenderHooksSet } from '.';

function getBaseRects(state: DeepReadonly<TrainDoorState>) {
  const rubber = state.rubberThickness / 0.25;
  const width = state.doorWidth / 2 - rubber;
  const height = state.doorHeight;

  return {
    left: normalizeRect({
      x: 0,
      y: 0,
      width,
      height,
    }),
    right: normalizeRect({
      x: state.doorWidth,
      y: 0,
      width: -width,
      height,
    }),
  };
}

function getWindowRings(state: DeepReadonly<TrainDoorState>, flip?: boolean) {
  const rects = getBaseRects(state);

  const options = {
    windowSize: { x: state.windowWidth / 0.25, y: state.windowHeight / 0.25 },
    offset: { x: state.windowXOffset / 0.25, y: state.windowYOffset / 0.25 },
    radius: state.windowCornerRadius / 0.25,
    segments: state.windowCornerDivisions,
    flip,
    flipWidth: state.doorWidth,
  };

  const left = getSingleWindowPolygon(rects.left, options);

  options.offset.x *= -1;
  const right = getSingleWindowPolygon(rects.right, options);

  return { left, right };
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

      const windowRings = getWindowRings(state, isInside);
      drawWindowsOnCanvas(args, [windowRings.left, windowRings.right]);

      // 戸先ゴム描画
      const rubber = state.rubberThickness / 0.25;
      ctx.fillStyle = state.rubberColor;
      const r = args.worldRectToCanvas({
        x: state.doorWidth / 2 - rubber,
        y: 0,
        width: rubber * 2,
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
  const doorSize = { x: state.doorWidth, y: state.doorHeight };
  const frontZ = state.doorThickness / 2 + state.doorZOffset;
  const backZ = -state.doorThickness / 2 + state.doorZOffset;
  const frontColor = hexToRgb(state.outsideColor);
  const backColor = hexToRgb(state.insideColor);
  const rubberThickness = state.rubberThickness / 0.25;
  const rubberColor = hexToRgb(state.rubberColor);

  const baseRects = getBaseRects(state);
  const windowRings = getWindowRings(state);

  const leftBuilder = new GeometryBuilder(builderOptions);
  const rightBuilder = new GeometryBuilder(builderOptions);

  buildSlidingDoorGeometry(leftBuilder, {
    baseRect: baseRects.left,
    outsidePaint,
    insidePaint,
    doorSize,
    frontZ,
    backZ,
    frontColor,
    backColor,
    direction: 'left',
    rubberThickness,
    rubberColor,
    windowRings: [windowRings.left],
  });

  buildSlidingDoorGeometry(rightBuilder, {
    baseRect: baseRects.right,
    outsidePaint,
    insidePaint,
    doorSize,
    frontZ,
    backZ,
    frontColor,
    backColor,
    direction: 'right',
    rubberThickness,
    rubberColor,
    windowRings: [windowRings.right],
  });

  return [
    { id: 'left', builder: leftBuilder },
    { id: 'right', builder: rightBuilder },
  ];
}

export function createLuaScript(
  state: DeepReadonly<TrainDoorState>,
) {
  const motionRange = state.doorWidth / 2 * 0.25;

  const script = `local MOTION_RANGE = ${motionRange}

local transform1 = matrix.identity()
local transform2 = matrix.identity()

function onTick()
  local value, success = component.getInputLogicSlotFloat(0)
  if success then
    local x = MOTION_RANGE * math.min(math.max(value, 0), 1)
    transform1 = matrix.translation(0, 0, x)
    transform2 = matrix.translation(0, 0, -x)
  end
end

function onRender()
  component.renderMesh0(transform1)
  component.renderMesh1(transform2)
end
`;

  return script;
}
