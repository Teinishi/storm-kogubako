// PolygonEditor の座標系から three の座標系へ
export function createCoordinateConverter(doorSize: Readonly<Vec2>) {
  const cx = Math.floor(doorSize.x / 2) + 0.5;
  const cy = Math.floor(doorSize.y / 2) + 0.5;

  return function (p: Readonly<Vec2>): Vec2 {
    return {
      x: 0.25 * (p.x - cx),
      y: 0.25 * (p.y - cy),
    };
  };
}
