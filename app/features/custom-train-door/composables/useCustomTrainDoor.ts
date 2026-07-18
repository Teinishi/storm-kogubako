import { reactive, type Reactive } from 'vue';
import { getWindowPolygon } from '../utils/customTrainDoor.client';
import type { TrainDoorState } from '../models/TrainDoorState';
import { createDefaultTrainDoorState } from '../models/TrainDoorState';
import type { PolygonEditorValue } from '~/features/polygon-editor/types/modelValue';
import type { RenderHooks } from '~/features/polygon-editor/types/render';

export function useCustomTrainDoor(
  renderOutsideEditor: () => void,
  renderInsideEditor: () => void,
) {
  const state = reactive<TrainDoorState>(createDefaultTrainDoorState());

  const outsidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });
  const insidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });

  const editorLogicalBounds = computed(() => ({
    width: state.doorWidth,
    height: state.doorHeight,
  }));

  const windowPolygon = computed(() => getWindowPolygon(state));

  const outsideRenderHooks = createRenderHooks(state, windowPolygon);
  const insideRenderHooks = createRenderHooks(state, windowPolygon, true);

  const outsideEditorProps = computed(() => ({
    logicalBounds: editorLogicalBounds.value,
    renderHooks: outsideRenderHooks,
  }));

  const insideEditorProps = computed(() => ({
    logicalBounds: editorLogicalBounds.value,
    renderHooks: insideRenderHooks,
  }));

  watch(windowPolygon, renderOutsideEditor);
  watch(windowPolygon, renderInsideEditor);

  return {
    state,
    windowPolygon,
    outsidePolygonEditorValue,
    insidePolygonEditorValue,
    outsideEditorProps,
    insideEditorProps,
  };
}

function createRenderHooks(
  state: Reactive<TrainDoorState>,
  windowPolygon: Ref<Vec2[]>,
  isInside: boolean = false,
): RenderHooks {
  return {
    onBeforeRenderPolygons({ ctx, worldRectToCanvas }) {
      // ベースカラー描画
      const r = worldRectToCanvas({ x: 0, y: 0, width: state.doorWidth, height: state.doorHeight });
      ctx.globalAlpha = 1;
      ctx.fillStyle = isInside ? state.insideColor : state.outsideColor;
      ctx.fillRect(r.x, r.y, r.width, r.height);
    },
    onBeforeRenderSelection({ editor, ctx, worldToCanvas, worldRectToCanvas }) {
      const hasSelection = editor.selectedPolygonId.value !== null;
      ctx.globalAlpha = hasSelection ? 0.6 : 1;

      // 窓描画
      let points = windowPolygon.value;
      if (isInside) {
        points = points.map(({ x, y }) => ({ x: state.doorWidth - x, y }));
      }
      if (points.length >= 3) {
        const midRing = offsetPolygon(points, 0.02 / 0.25 / 2);
        const outerRing = offsetPolygon(points, 0.02 / 0.25);

        const { boundsMin, boundsMax } = getBoundingBox(windowPolygon.value)!;
        const { y: top } = worldToCanvas({ x: 0, y: boundsMax.y });
        const { y: bottom } = worldToCanvas({ x: 0, y: boundsMin.y });

        const grad = ctx.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, 'hsl(220 75% 52%)');
        grad.addColorStop(1, 'hsl(177 33% 76%)');
        ctx.fillStyle = grad;

        ctx.beginPath();
        drawPolygonOnCanvas(ctx, hasSelection ? points : midRing, worldToCanvas);
        ctx.fill();

        ctx.fillStyle = '#545454';
        ctx.beginPath();
        drawPolygonOnCanvas(ctx, points, worldToCanvas);
        drawPolygonOnCanvas(ctx, outerRing, worldToCanvas);
        ctx.closePath();
        ctx.fill('evenodd');
      }

      // 戸先ゴム描画
      const rubber = state.rubberThickness / 0.25;
      ctx.fillStyle = state.rubberColor;
      const r = worldRectToCanvas({
        x: isInside ? state.doorWidth : 0,
        y: 0,
        width: isInside ? -rubber : rubber,
        height: state.doorHeight,
      });
      ctx.fillRect(r.x, r.y, r.width, r.height);
    },
  };
}
