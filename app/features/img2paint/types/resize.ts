import { createDefaultBaseAnchorState, createDefaultGlowAnchorState, type AnchorState } from './anchor';

export interface ResizeState {
  sizeType: 'block' | 'pixel' | 'percent';
  keepAspect: boolean;
  sizePriority: 'width' | 'height';
  widthPixels: number;
  heightPixels: number;
  resizeAlgo: 'pixelated' | 'smooth';
  anchor: AnchorState;
}

export function createDefaultBaseResizeState(): ResizeState {
  return {
    sizeType: 'block',
    keepAspect: true,
    sizePriority: 'width',
    widthPixels: 9,
    heightPixels: 9,
    resizeAlgo: 'pixelated',
    anchor: createDefaultBaseAnchorState(),
  };
}

export function createDefaultGlowResizeState(): ResizeState {
  return {
    sizeType: 'block',
    keepAspect: true,
    sizePriority: 'width',
    widthPixels: 9,
    heightPixels: 9,
    resizeAlgo: 'pixelated',
    anchor: createDefaultGlowAnchorState(),
  };
}
