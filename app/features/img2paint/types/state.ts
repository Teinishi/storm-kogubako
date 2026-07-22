import {
  createDefaultBaseResizeState,
  createDefaultGlowResizeState,
  type ResizeState,
} from './resize';

export interface Img2PaintState {
  baseImageFile: File | null;
  baseImage: HTMLImageElement | null;
  glowImageFile: File | null;
  glowImageRaw: HTMLImageElement | null;
  glowImage: HTMLImageElement | HTMLCanvasElement | null;
  glowImageDisplay: HTMLCanvasElement | null;
  adjustGlow: boolean;
  baseResize: ResizeState;
  glowResize: ResizeState;
  bgColor: string;
  minimizeSigns: boolean;
  minimizeIndicators: boolean;
  enableLogicLinks: boolean;
  enableEletricLinks: boolean;
  saveFileName: string;
}

export function createDefaultImg2PaintState(): Img2PaintState {
  return {
    baseImageFile: null,
    baseImage: null,
    glowImageFile: null,
    glowImageRaw: null,
    glowImage: null,
    glowImageDisplay: null,
    adjustGlow: true,
    baseResize: createDefaultBaseResizeState(),
    glowResize: createDefaultGlowResizeState(),
    bgColor: '#FFFFFF',
    minimizeSigns: true,
    minimizeIndicators: true,
    enableLogicLinks: true,
    enableEletricLinks: true,
    saveFileName: 'file.xml',
  };
}
