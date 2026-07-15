import { reactive, type Reactive } from 'vue';
import type { Rect, Vec2 } from '~/utils/utils';
import { createRoundedRectPolygon } from '~/utils/polygonUtils';
import type { RenderHooks } from '~/composables/usePolygonEditorCanvas';

export interface TrainDoorState {
  doorWidth: number;
  doorHeight: number;
  doorThickness: number;
  doorZOffset: number;
  outsideColor: string;
  insideColor: string;
  rubberThickness: number;
  rubberColor: string;
  windowXOffset: number;
  windowYOffset: number;
  windowWidth: number;
  windowHeight: number;
  windowCornerRadius: number;
  windowCornerDivisions: number;
}

export function useCustomTrainDoor(
  renderOutsideEditor: () => void,
  renderInsideEditor: () => void,
) {
  const state = reactive<TrainDoorState>({
    doorWidth: 3,
    doorHeight: 8,
    doorThickness: 0.1,
    doorZOffset: 0,
    outsideColor: '#c0c7cf',
    insideColor: '#ffffff',
    rubberThickness: 0.03,
    rubberColor: '#545454',
    windowXOffset: 0,
    windowYOffset: 0.125,
    windowWidth: 0.5,
    windowHeight: 1,
    windowCornerRadius: 0.08,
    windowCornerDivisions: 1,
  });

  const outsidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });
  const insidePolygonEditorValue = ref<PolygonEditorValue>({ polygons: [] });

  const editorLogicalBounds = computed(() => ({
    width: state.doorWidth,
    height: state.doorHeight,
  }));

  const windowRect = computed(() => {
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
  });

  const windowPolygon = computed(() => createRoundedRectPolygon(
    windowRect.value,
    state.windowCornerRadius / 0.25,
    state.windowCornerDivisions,
  ));

  const outsideRenderHooks = createRenderHooks(state, windowRect, windowPolygon);
  const insideRenderHooks = createRenderHooks(state, windowRect, windowPolygon, true);

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
    windowRect,
    windowPolygon,
    outsidePolygonEditorValue,
    insidePolygonEditorValue,
    outsideEditorProps,
    insideEditorProps,
  };
}

function createRenderHooks(
  state: Reactive<TrainDoorState>,
  windowRect: Ref<Rect>,
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

        const { y: top } = worldToCanvas({ x: 0, y: windowRect.value.y + windowRect.value.height });
        const { y: bottom } = worldToCanvas({ x: 0, y: windowRect.value.y });
        const grad = ctx.createLinearGradient(0, top, 0, bottom);
        grad.addColorStop(0, 'hsl(220 75% 52%)');
        grad.addColorStop(1, 'hsl(177 33% 76%)');
        ctx.fillStyle = grad;

        ctx.beginPath();
        polygonOnCanvas(ctx, hasSelection ? points : midRing, worldToCanvas);
        ctx.fill();

        ctx.fillStyle = '#545454';
        ctx.beginPath();
        polygonOnCanvas(ctx, points, worldToCanvas);
        polygonOnCanvas(ctx, outerRing, worldToCanvas);
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
