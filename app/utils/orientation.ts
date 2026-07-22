type Axis = 'x' | 'y' | 'z';

interface AxisMapping {
  axis: Axis;
  sign: 1 | -1;
}

export class Orientation {
  constructor(
    public readonly x: AxisMapping,
    public readonly y: AxisMapping,
    public readonly z: AxisMapping,
  ) {}

  static readonly Identity = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: 1 },
  );

  // Y rotation
  static readonly RotateY90 = new Orientation(
    { axis: 'z', sign: 1 },
    { axis: 'y', sign: 1 },
    { axis: 'x', sign: -1 },
  );

  static readonly RotateY180 = new Orientation(
    { axis: 'x', sign: -1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: -1 },
  );

  static readonly RotateY270 = new Orientation(
    { axis: 'z', sign: -1 },
    { axis: 'y', sign: 1 },
    { axis: 'x', sign: 1 },
  );

  // X rotation
  static readonly RotateX90 = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'z', sign: -1 },
    { axis: 'y', sign: 1 },
  );

  static readonly RotateX180 = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: -1 },
    { axis: 'z', sign: -1 },
  );

  static readonly RotateX270 = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'z', sign: 1 },
    { axis: 'y', sign: -1 },
  );

  // Z rotation
  static readonly RotateZ90 = new Orientation(
    { axis: 'y', sign: -1 },
    { axis: 'x', sign: 1 },
    { axis: 'z', sign: 1 },
  );

  static readonly RotateZ180 = new Orientation(
    { axis: 'x', sign: -1 },
    { axis: 'y', sign: -1 },
    { axis: 'z', sign: 1 },
  );

  static readonly RotateZ270 = new Orientation(
    { axis: 'y', sign: 1 },
    { axis: 'x', sign: -1 },
    { axis: 'z', sign: 1 },
  );

  // Mirrors
  static readonly FlipX = new Orientation(
    { axis: 'x', sign: -1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: 1 },
  );

  static readonly FlipY = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: -1 },
    { axis: 'z', sign: 1 },
  );

  static readonly FlipZ = new Orientation(
    { axis: 'x', sign: 1 },
    { axis: 'y', sign: 1 },
    { axis: 'z', sign: -1 },
  );

  transformPosition(src: Readonly<Vec3>): Vec3 {
    const get = (m: AxisMapping) => src[m.axis] * m.sign;

    return {
      x: get(this.x),
      y: get(this.y),
      z: get(this.z),
    };
  }

  toMatrix3(): Mat3 {
    const row = (m: AxisMapping): [number, number, number] => {
      switch (m.axis) {
        case 'x':
          return [m.sign, 0, 0];
        case 'y':
          return [0, m.sign, 0];
        case 'z':
          return [0, 0, m.sign];
      }
    };

    return [...row(this.x), ...row(this.y), ...row(this.z)];
  }
}
