import type { StrictOmit } from 'ts-essentials';

export interface VehicleComponent {
  type?: string;
  position: Vec3;
  rotation?: Mat3 | Orientation;
  flip?: { x?: boolean; y?: boolean; z?: boolean };
}

export type VehicleLogicType =
  | 'boolean'
  | 'number'
  | 'power'
  | 'fluid'
  | 'electric'
  | 'composite'
  | 'video'
  | 'audio'
  | 'rope';

export interface VehicleLogicLink {
  from: Vec3;
  to: Vec3;
  type: VehicleLogicType;
}

export interface VehicleBody {
  id: string;
  components: VehicleComponent[];
}

export class VehicleBuilder {
  private bodies: VehicleBody[] = [{ id: 'root', components: [] }];
  private logicLinks: VehicleLogicLink[] = [];

  addBody(bodyId: string) {
    if (this.bodies.findIndex((b) => b.id === bodyId) !== -1) {
      throw new Error(`A body with id "${bodyId}" already exists.`);
    }
    this.bodies.push({ id: bodyId, components: [] });
  }

  addComponent(bodyId: string, component: VehicleComponent) {
    const body = this.bodies.find((b) => b.id === bodyId);
    if (body === undefined) {
      throw new Error(`No body found with id "${bodyId}".`);
    }
    body.components.push(component);
  }

  addCuboid(
    bodyId: string,
    from: Readonly<Vec3>,
    to: Readonly<Vec3>,
    options?: StrictOmit<VehicleComponent, 'type' | 'position' | 'rotation' | 'flip'>,
  ) {
    forVoxels(from, to, (position) => {
      this.addComponent(bodyId, { position, ...options });
    });
  }

  addLogicLink(from: Readonly<Vec3>, to: Readonly<Vec3>, type: VehicleLogicType) {
    this.logicLinks.push({ from, to, type });
  }

  toXml() {
    const writer = new XmlWriter(false);

    writer.begin('vehicle', [
      { name: 'data_version', value: 3 },
      { name: 'bodies_id', value: this.bodies.length },
    ]);

    writer.empty('authors');

    writer.begin('bodies');
    this.bodies.forEach((body, i) => {
      writer.begin('body', [{ name: 'unique_id', value: i + 1 }]);

      writer.begin('components');
      for (const component of body.components) {
        const cAttrs = [
          { name: 'd', value: component.type },
          { name: 't', value: this.toFlipAttrValue(component.flip) },
        ];
        const oAttrs = [{ name: 'r', value: this.toRotationAttrValue(component.rotation) }];

        writer.element('c', cAttrs, (writer) => {
          writer.element('o', oAttrs, (writer) => {
            const { position } = component;
            if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
              writer.empty('vp', vec3ToAttrs(position, true));
            }
          });
        });
      }
      writer.end('components');

      writer.end('body');
    });
    writer.end('bodies');

    if (this.logicLinks.length > 0) {
      writer.element('logic_node_links', [], (writer) => {
        for (const logicLink of this.logicLinks) {
          writer.begin('logic_node_link', [
            { name: 'type', value: this.toLogicTypeAttrValue(logicLink.type) },
          ]);
          writer.empty('voxel_pos_0', vec3ToAttrs(logicLink.from, true));
          writer.empty('voxel_pos_1', vec3ToAttrs(logicLink.to, true));
          writer.end('logic_node_link');
        }
      });
    }

    writer.end('vehicle');

    return writer.toString();
  }

  private toRotationAttrValue(rotation: Mat3 | Orientation | undefined) {
    let value: Mat3;
    if (rotation === undefined) {
      value = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    } else if (rotation instanceof Orientation) {
      value = rotation.toMat3();
    } else {
      value = rotation;
    }
    if ([0, 0, 1, -1, 0, 0, 0, -1, 0].every((v, i) => v === value[i])) {
      return undefined;
    }
    return value.join(',');
  }

  private toFlipAttrValue(flip?: VehicleComponent['flip']) {
    let value = 0;
    if (flip && flip.x) value |= 1;
    if (flip && flip.y) value |= 2;
    if (flip && flip.z) value |= 4;
    if (value === 0) return undefined;
    return value;
  }

  private toLogicTypeAttrValue(type: VehicleLogicType) {
    const value = getLogicTypeIndex(type);
    if (value === 0) return undefined;
    return value;
  }
}

function getLogicTypeIndex(value: VehicleLogicType) {
  switch (value) {
    case 'boolean':
      return 0;
    case 'number':
      return 1;
    case 'power':
      return 2;
    case 'fluid':
      return 3;
    case 'electric':
      return 4;
    case 'composite':
      return 5;
    case 'video':
      return 6;
    case 'audio':
      return 7;
    case 'rope':
      return 8;
    default:
      value satisfies never;
      throw new Error('Unexpected');
  }
}
