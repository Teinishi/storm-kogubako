import type { Img2PaintState } from '../types/Img2PaintState';
import { createDefaultImg2PaintState } from '../types/Img2PaintState';
import { getImageSize } from '../utils/image';
import { getDrawData, getAnchorOffset } from '../utils/anchor';

export function useImg2Paint() {
  // 元画像
  const state = reactive<Img2PaintState>(createDefaultImg2PaintState());

  const baseImageSize = computed(() => getImageSize(state.baseImage));
  const glowImageSize = computed(() => getImageSize(state.glowImage));
  const imageSizeMatched = computed(() => {
    if (!baseImageSize.value || !glowImageSize.value) return false;
    return baseImageSize.value.width === glowImageSize.value.width && baseImageSize.value.height === glowImageSize.value.height;
  });

  const baseDrawData = computed(() => getDrawData(
    state.baseResize.widthPixels,
    state.baseResize.heightPixels,
    state.baseResize.anchor,
  ));

  const glowOffset = computed(() => {
    const { x, y } = getAnchorOffset(
      state.glowResize.widthPixels,
      state.glowResize.heightPixels,
      state.baseResize.widthPixels,
      state.baseResize.heightPixels,
      state.glowResize.anchor.anchorPosition,
    );
    return {
      x: x + state.glowResize.anchor.offsetX + baseDrawData.value.offset.x,
      y: y + state.glowResize.anchor.offsetY + baseDrawData.value.offset.y,
    };
  });

  const computedValues = computed(() => ({
    baseImageSize: baseImageSize.value,
    glowImageSize: glowImageSize.value,
    imageSizeMatched: imageSizeMatched.value,
    baseDrawData: baseDrawData.value,
    glowOffset: glowOffset.value,
  }));

  watchEffect(() => {
    if (imageSizeMatched.value) {
      state.glowResize = { ...state.baseResize };
    }
  });

  return {
    state,
    computedValues,
  };
}
