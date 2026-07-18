import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import type { TrainDoorState } from '../types/TrainDoorState';

const WINDOW_FRAME_WIDTH = 0.02;
const WINDOW_FRAME_COLOR = '#545454';

function getDoorZ(state: Readonly<TrainDoorState>) {
  return {
    front: state.doorThickness / 2 + state.doorZOffset,
    back: -state.doorThickness / 2 + state.doorZOffset,
  };
}

export function getDoorRect(state: Readonly<TrainDoorState>) {
  const rubber = state.rubberThickness / 0.25;
  return {
    x: rubber,
    y: 0,
    width: state.doorWidth - rubber,
    height: state.doorHeight,
  };
}

export function getWindowRect(state: Readonly<TrainDoorState>) {
  const wBlocks = state.windowWidth / 0.25;
  const hBlocks = state.windowHeight / 0.25;
  const rubber = state.rubberThickness / 0.25;
  const x = (state.doorWidth - rubber - wBlocks) / 2 + rubber + state.windowXOffset / 0.25;
  const top = state.doorHeight - state.windowYOffset / 0.25;
  return {
    x,
    y: top - hBlocks,
    width: wBlocks,
    height: hBlocks,
  };
}

export function getWindowPolygon(state: Readonly<TrainDoorState>) {
  return createRoundedRectPolygon(
    getWindowRect(state),
    state.windowCornerRadius / 0.25,
    state.windowCornerDivisions,
  );
}

// PolygonEditor の座標からメッシュの座標へ
function posToMeters(state: Readonly<TrainDoorState>, p: Vec2, z?: number): Vec3 {
  const x = 0.25 * (p.x - Math.floor(state.doorWidth / 2) - 0.5);
  const y = 0.25 * (p.y - Math.floor(state.doorHeight / 2) - 0.5);
  return { x, y, z: z ?? 0 };
}

function ringToMeters(state: Readonly<TrainDoorState>, ring: Vec2[], z?: number) {
  return ring.map(v => posToMeters(state, v, z));
}

// ドア外側面のメッシュ生成
export function buildOutsideGeometry(
  builder: GeometryBuilder,
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
) {
  const { polygons } = outsidePaint;
  const transformedPolygons = polygons.map(({ id, vertices }) => ({
    id,
    polygon: [ringToMeters(state, vertices)],
  }));

  const doorRect = getDoorRect(state);
  const windowHole = getWindowPolygon(state);
  const rectRing = ringToMeters(state, rectToPolygon(doorRect));
  const holeRing = ringToMeters(state, offsetPolygon(windowHole, WINDOW_FRAME_WIDTH / 0.25));
  const z = getDoorZ(state).front;

  const disjoint = eliminatePolygonOverlap(
    transformedPolygons,
    {
      base: { id: -1, polygon: [rectRing] },
      holes: [holeRing],
    },
  );

  for (const { id, polygon } of disjoint) {
    const color = hexToRgb(polygons.find(v => v.id === id)?.color ?? state.outsideColor);
    builder.addPolygon(polygon, { z, color });
  }
}

// ドア内側面のメッシュ生成
export function buildInsideGeometry(
  builder: GeometryBuilder,
  state: Readonly<TrainDoorState>,
  insidePaint: Readonly<PolygonEditorValue>,
) {
  const w = state.doorWidth;
  const { polygons } = insidePaint;
  const transformedPolygons = polygons.map(({ id, vertices }) => ({
    id,
    polygon: [ringToMeters(state, vertices.map(v => ({ x: w - v.x, y: v.y })))],
  }));

  const doorRect = getDoorRect(state);
  const windowHole = getWindowPolygon(state);
  const rectRing = ringToMeters(state, rectToPolygon(doorRect));
  const holeRing = offsetPolygon(ringToMeters(state, windowHole), WINDOW_FRAME_WIDTH);
  const z = getDoorZ(state).back;

  const disjoint = eliminatePolygonOverlap(
    transformedPolygons,
    {
      base: { id: -1, polygon: [rectRing] },
      holes: [holeRing],
    },
  );

  for (const { id, polygon } of disjoint) {
    const color = hexToRgb(polygons.find(v => v.id === id)?.color ?? state.insideColor);
    builder.addPolygon(polygon, { z, color, flip: true });
  }
}

// ドア側面と戸先ゴムのメッシュ生成
export function buildSideGeometry(
  builder: GeometryBuilder,
  state: Readonly<TrainDoorState>,
) {
  const { front: z1, back: z2 } = getDoorZ(state);

  // ドア側面
  const rect = getDoorRect(state);

  const path = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  builder.addExtrudedSides(
    path.map(v => posToMeters(state, v)),
    {
      zRange: [z1, z2],
      color: hexToRgb(state.outsideColor),
    },
  );

  // 戸先ゴム
  const rubberColor = hexToRgb(state.rubberColor);

  const { x: x1, y: y1 } = posToMeters(state, { x: 0, y: 0 });
  const { x: x2, y: y2 } = posToMeters(state, { x: state.rubberThickness / 0.25, y: state.doorHeight });
  const z1i = lerp(z1, z2, 0.2);
  const z2i = lerp(z2, z1, 0.2);

  const v0 = { x: x1, y: y1, z: z1i };
  const v1 = { x: x2, y: y1, z: z1 };
  const v2 = { x: x2, y: y2, z: z1 };
  const v3 = { x: x1, y: y2, z: z1i };
  const v4 = { x: x1, y: y1, z: z2i };
  const v5 = { x: x2, y: y1, z: z2 };
  const v6 = { x: x2, y: y2, z: z2 };
  const v7 = { x: x1, y: y2, z: z2i };

  builder.addFace([v0, v1, v2, v3], rubberColor);
  builder.addFace([v3, v2, v6, v7], rubberColor);
  builder.addFace([v7, v6, v5, v4], rubberColor);
  builder.addFace([v4, v5, v1, v0], rubberColor);
  builder.addFace([v0, v3, v7, v4], rubberColor);
}

// 窓のメッシュ生成
export function buildWindowGeometry(
  builder: GeometryBuilder,
  state: Readonly<TrainDoorState>,
) {
  const color = hexToRgb(WINDOW_FRAME_COLOR);
  const { front: z1, back: z2 } = getDoorZ(state);

  const windowHole = getWindowPolygon(state);
  const innerRing = ringToMeters(state, windowHole);
  const outerRing = offsetPolygon(innerRing, WINDOW_FRAME_WIDTH);
  innerRing.reverse();

  builder.addPolygon([outerRing, innerRing], { z: z1, color });
  builder.addPolygon([outerRing, innerRing], { z: z2, color, flip: true });
  builder.addExtrudedSides(innerRing, { close: true, zRange: [z1, z2], color });
  builder.addPolygon([innerRing], { z: z1, materialIndex: 1 });
  builder.addPolygon([innerRing], { z: z1 - 0.02, materialIndex: 1, flip: true });
}

export function saveMesh(
  state: Readonly<TrainDoorState>,
  outsidePaint: Readonly<PolygonEditorValue>,
  insidePaint: Readonly<PolygonEditorValue>,
) {
  const builder = new GeometryBuilder();
  builder.refine = true;

  buildOutsideGeometry(builder, state, outsidePaint);
  buildInsideGeometry(builder, state, insidePaint);
  buildSideGeometry(builder, state);
  buildWindowGeometry(builder, state);
  builder.transform(Orientation.RotateY90);

  saveFile(builder.createMeshFile(), 'train_door.mesh');
}

function saveFile(data: BlobPart, name: string) {
  const blob = new Blob([data], {
    type: 'application/octet-stream',
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}
