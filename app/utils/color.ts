export interface Color {
  r: number;
  g: number;
  b: number;
}

export const BLACK = { r: 0, g: 0, b: 0 } as const;
export const WHITE = { r: 255, g: 255, b: 255 } as const;

function to16(num: number) {
  const hex = num.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export const rgbToHex = ({ r, g, b }: Readonly<Color>) => `#${to16(r)}${to16(g)}${to16(b)}`;

export function hexToRgb(hex: string) {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0]!.repeat(2), 16),
      g: parseInt(hex[1]!.repeat(2), 16),
      b: parseInt(hex[2]!.repeat(2), 16),
    };
  } else if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { ...BLACK };
}

export const colorEquals = (a: Readonly<Color>, b: Readonly<Color>) =>
  a.r === b.r && a.g === b.g && a.b === b.b;
