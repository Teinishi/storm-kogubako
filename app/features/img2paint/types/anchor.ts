export const ANCHOR_POSITIONS = [
  { value: 'top-left', icon: 'i-lucide-arrow-up-left' },
  { value: 'top-center', icon: 'i-lucide-arrow-up' },
  { value: 'top-right', icon: 'i-lucide-arrow-up-right' },
  { value: 'mid-left', icon: 'i-lucide-arrow-left' },
  { value: 'center', icon: 'i-lucide-plus' },
  { value: 'mid-right', icon: 'i-lucide-arrow-right' },
  { value: 'bottom-left', icon: 'i-lucide-arrow-down-left' },
  { value: 'bottom-center', icon: 'i-lucide-arrow-down' },
  { value: 'bottom-right', icon: 'i-lucide-arrow-down-right' },
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
