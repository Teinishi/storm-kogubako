const POLYGON_COLORS = [
  '#0F766E',
  '#1D4ED8',
  '#7C3AED',
  '#B45309',
  '#DC2626',
  '#059669',
  '#C026D3',
  '#0284C7',
];

let nextPolygonColorIndex = 0;

export function getNextPolygonColor() {
  const color = POLYGON_COLORS[nextPolygonColorIndex % POLYGON_COLORS.length]!;
  nextPolygonColorIndex += 1;
  return color;
}
