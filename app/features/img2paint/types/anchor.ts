export const ANCHOR_POSITIONS = [
  { value: 'top-left', icon: 'i-heroicons-arrow-up-left' },
  { value: 'top-center', icon: 'i-heroicons-arrow-up' },
  { value: 'top-right', icon: 'i-heroicons-arrow-up-right' },
  { value: 'mid-left', icon: 'i-heroicons-arrow-left' },
  { value: 'center', icon: 'i-heroicons-plus' },
  { value: 'mid-right', icon: 'i-heroicons-arrow-right' },
  { value: 'bottom-left', icon: 'i-heroicons-arrow-down-left' },
  { value: 'bottom-center', icon: 'i-heroicons-arrow-down' },
  { value: 'bottom-right', icon: 'i-heroicons-arrow-down-right' },
] as const;

export type AnchorPosition = (typeof ANCHOR_POSITIONS)[number]['value'];

export interface AnchorState {
  anchorPosition: AnchorPosition;
  offsetX: number;
  offsetY: number;
}

export function createDefaultBaseAnchorState(): AnchorState {
  return {
    anchorPosition: 'center',
    offsetX: 0,
    offsetY: 0,
  };
}

export function createDefaultGlowAnchorState(): AnchorState {
  return {
    anchorPosition: 'center',
    offsetX: 0,
    offsetY: 0,
  };
}
