// ポリゴンを Canvas に書く
export function polygonOnCanvas(ctx: CanvasRenderingContext2D, polygon: readonly Vec2[], coordinateConversion?: (point: Vec2) => Vec2) {
  polygon.forEach((point, i) => {
    const p = coordinateConversion ? coordinateConversion(point) : point;
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    }
    else {
      ctx.lineTo(p.x, p.y);
    }
  });
}
