import type { Reactive } from 'vue';
import type { RenderHooks, PolygonEditorPolygon } from '~/features/polygon-editor';
import type { DoorUnitFileNameSet, RenderHooksSet } from '.';
import { drawWindowsOnCanvas, getSingleWindowPolygon } from '../doorWindow/basic';
import type { TrainDoorState } from '../types';
import {
  drawBackground,
  buildSlidingDoorGeometry,
  DefinitionBuilder,
  getVoxelRange,
  getVoxelVolume,
  VehicleBuilder,
} from '../utils';

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
    frameThickness: state.windowFrameThickness,
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
      drawWindowsOnCanvas(args, [windowRings.left, windowRings.right], state.windowFrameColor);

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
  outsidePaint: DeepReadonly<PolygonEditorPolygon[]>,
  insidePaint: DeepReadonly<PolygonEditorPolygon[]>,
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
    windowFrameColor: state.windowFrameColor,
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
    windowFrameColor: state.windowFrameColor,
  });

  return [
    { id: 'left', builder: leftBuilder },
    { id: 'right', builder: rightBuilder },
  ];
}

export function getFilenames(_state: DeepReadonly<TrainDoorState>, fingerprint: string) {
  const visual = `m_train_door_visual_${fingerprint}`;

  return {
    doorUnitVehicleName: `m_train_door_${fingerprint}.xml`,
    visualDefinition: `${visual}.xml`,
    script: `m_train_door_${fingerprint}.lua`,
    meshes: {
      left: `m_train_door_left_${fingerprint}.mesh`,
      right: `m_train_door_right_${fingerprint}.mesh`,
    },
    collisionDefinition: `m_train_door_collision_${fingerprint}.xml`,
    meshesZip: `m_train_door_meshes_${fingerprint}.zip`,
    visualComponentZip: `${visual}.zip`,
  };
}

// 見た目用コンポーネントの Definition XML を生成
export function createVisualComponent(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
  filenames: DeepReadonly<DoorUnitFileNameSet>,
) {
  if (state.doorWidth < 3) {
    throw new Error('The width for double sliding door must be at least 3.');
  }

  const voxelRange = getVoxelRange(state.doorWidth, state.doorHeight);

  // 左右1マスは当たり判定コンポーネントのために空ける
  voxelRange.min.z += 1;
  voxelRange.max.z -= 1;

  const volume = getVoxelVolume(voxelRange.min, voxelRange.max);

  const builder = new DefinitionBuilder();

  builder.addAttribute('name', `(M) Train Door Visual ${fingerprint}`);
  builder.addAttribute('category', 2);
  builder.addAttribute('type', 66);
  builder.addAttribute('mass', 0.5 * volume);
  builder.addAttribute('value', 4 * volume);
  builder.addAttribute('flags', 0);
  builder.addAttribute('tags', 'mod,train,door');
  builder.addAttribute('mesh_0_name', filenames.meshes.left);
  builder.addAttribute('mesh_1_name', filenames.meshes.right);
  builder.addAttribute('lua_filename', filenames.script);

  builder.addSurfacesCuboid(voxelRange.min, voxelRange.max, [0, 1, 2, 3, 4, 5], { shape: 0 });
  builder.addBuoyancySurfacesCuboid(voxelRange.min, voxelRange.max, [0, 1], { shape: 1 });
  builder.addVoxels(voxelRange.min, voxelRange.max, { flags: 4 });

  builder.addLogicNode({
    position: { x: 0, y: -1, z: 0 },
    label: 'Position',
    mode: 1,
    type: 1,
    description: 'Controls the position of the door with the value between 0 and 1.',
  });
  builder.addLogicNode({
    label: 'Connect to Collision Component',
    mode: 0,
    type: 0,
    description: 'Controls the collision component to synchronize with the visual.',
  });

  builder.addElement('tooltip_properties', [
    {
      name: 'short_description',
      value: 'Sliding door that can be opened and closed using a number input.',
    },
  ]);

  return builder.toXml();
}

// 見た目用コンポーネントの Lua を生成
export function createLuaScript(state: DeepReadonly<TrainDoorState>) {
  const motionRange = (state.doorWidth / 2) * 0.25;

  const script = `local MOTION_RANGE = ${motionRange}

local transform1 = matrix.identity()
local transform2 = matrix.identity()
local collisionPos = 0

function onTick()
  local value, _ = component.getInputLogicSlotFloat(0)
  local x = MOTION_RANGE * math.min(math.max(value, 0), 1)
  transform1 = matrix.translation(0, 0, x)
  transform2 = matrix.translation(0, 0, -x)

  local control = (value >= 1) or (60 * x > collisionPos)
  if control then
    collisionPos = collisionPos + 1
  else
    collisionPos = collisionPos - 1
  end
  collisionPos = math.min(math.max(collisionPos, 0), 60 * MOTION_RANGE)
  component.setOutputLogicSlotBool(0, control)
end

function onRender()
  component.renderMesh0(transform1)
  component.renderMesh1(transform2)
end
`;

  return script;
}

// 当たり判定用コンポーネントの Definition XML を生成
export function createCollisionComponent(state: DeepReadonly<TrainDoorState>, fingerprint: string) {
  if (state.doorWidth < 3) {
    throw new Error('The width for double sliding door must be at least 3.');
  }

  const width = state.doorWidth / 2;
  const height = state.doorHeight;

  const voxelRange = getVoxelRange(state.doorWidth, state.doorHeight);
  voxelRange.min.z = 0;
  voxelRange.max.z = 0;

  const volume = getVoxelVolume(voxelRange.min, voxelRange.max);

  const builder = new DefinitionBuilder();

  builder.addAttribute('name', `(M) Train Door Collision ${fingerprint}`);
  builder.addAttribute('category', 2);
  builder.addAttribute('type', 13);
  builder.addAttribute('mass', 0.5 * volume);
  builder.addAttribute('value', 4 * volume);
  builder.addAttribute('flags', 1);
  builder.addAttribute('tags', 'mod,train,door');
  builder.addAttribute('door_lower_limit', -(width - 1) / 2);
  builder.addAttribute('door_upper_limit', (width + 1) / 2);
  builder.addAttribute('door_flipped', false);
  builder.addAttribute('door_side_dist', width);
  builder.addAttribute('door_up_dist', height - 1);

  builder.addElement('door_size', vec3ToAttrs({ x: 0.5, y: height, z: width }));
  builder.addElement('door_normal', vec3ToAttrs({ x: -1, y: 0, z: 0 }));
  builder.addElement('door_side', vec3ToAttrs({ x: 0, y: 0, z: 1 }));
  builder.addElement('door_up', vec3ToAttrs({ x: 0, y: 1, z: 0 }));
  builder.addElement('door_base_pos', vec3ToAttrs({ x: 0, y: voxelRange.min.y, z: 0 }));

  builder.addSurfacesCuboid(voxelRange.min, voxelRange.max, [0, 1, 2, 3, 4, 5], { shape: 0 });
  builder.addBuoyancySurfacesCuboid(voxelRange.min, voxelRange.max, [0, 1], { shape: 1 });
  builder.addVoxels(voxelRange.min, voxelRange.max, { flags: 4 });

  builder.addLogicNode({
    label: 'Open/Close',
    mode: 1,
    type: 0,
    description:
      'Opens the door when receiving an on signal, and closes it when receiving an off signal.',
  });
  builder.addLogicNode({
    label: 'Electric',
    mode: 1,
    type: 4,
    description: 'Electrical power connection.',
  });

  builder.addElement('tooltip_properties', [
    {
      name: 'short_description',
      value: 'Sliding door that can be opened and closed using an on/off signal.',
    },
  ]);

  return builder.toXml();
}

// ドアユニットビークルを生成
export function createDoorUnitVehicle(
  state: DeepReadonly<TrainDoorState>,
  visualComponentName: string,
  collisionComponentName: string,
) {
  const voxelRange = getVoxelRange(state.doorWidth, state.doorHeight);

  const visualPos = { x: 0, y: 0, z: 0 };
  const collisionRightPos = { x: 0, y: 0, z: voxelRange.min.z };
  const collisionLeftPos = { x: 0, y: 0, z: voxelRange.max.z };

  const builder = new VehicleBuilder();

  builder.addComponent('root', {
    type: visualComponentName,
    position: visualPos,
  });
  builder.addComponent('root', {
    type: collisionComponentName,
    position: collisionRightPos,
  });
  builder.addComponent('root', {
    type: collisionComponentName,
    position: collisionLeftPos,
    flip: { z: true },
  });

  builder.addCuboid(
    'root',
    { x: -1, y: 0, z: voxelRange.min.z - 1 },
    { x: -1, y: 0, z: voxelRange.max.z + 1 },
  );
  builder.addComponent('root', {
    position: { x: -1, y: voxelRange.min.y - 1, z: voxelRange.min.z - 1 },
  });
  builder.addComponent('root', {
    position: { x: -1, y: voxelRange.min.y - 1, z: voxelRange.max.z + 1 },
  });
  builder.addComponent('root', {
    position: { x: -1, y: voxelRange.max.y + 1, z: voxelRange.min.z - 1 },
  });
  builder.addComponent('root', {
    position: { x: -1, y: voxelRange.max.y + 1, z: voxelRange.max.z + 1 },
  });

  builder.addLogicLink(visualPos, collisionRightPos, 'boolean');
  builder.addLogicLink(visualPos, collisionLeftPos, 'boolean');

  return builder.toXml();
}
