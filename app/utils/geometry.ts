export function distanceToSegment(point: Readonly<Vec2>, start: Readonly<Vec2>, end: Readonly<Vec2>) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    return {
      distance: Math.hypot(dx, dy),
      point: cloneVec2(start),
    };
  }

  const rawT = ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared;
  const t = Math.max(0, Math.min(1, rawT));
  const projected = {
    x: start.x + t * deltaX,
    y: start.y + t * deltaY,
  };
  return {
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
    point: projected,
  };
}

export function pointInPolygon(point: Readonly<Vec2>, vertices: readonly Readonly<Vec2>[]) {
  if (vertices.length < 3) return false;

  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const current = vertices[index];
    const previousVertex = vertices[previous];
    if (!current || !previousVertex) continue;
    const intersects = ((current.y > point.y) !== (previousVertex.y > point.y))
      && (point.x < ((previousVertex.x - current.x) * (point.y - current.y)) / ((previousVertex.y - current.y) || 1e-12) + current.x);
    if (intersects) inside = !inside;
  }

  return inside;
}
