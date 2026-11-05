import { serializeVehicleXml, type Vehicle } from '@sw-file-lib/xml';
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
    const vehicle: Vehicle = {
      data_version: 3,
      bodies_id: this.bodies.length,
      authors: [],
      bodies: this.bodies.map((body, i) => ({
        unique_id: i + 1,
        components: body.components.map((component) => ({
          d: component.type,
          t: this.toFlipAttrValue(component.flip),
          o: {
            r: this.toRotationAttrValue(component.rotation),
            vp: createXmlVec3(component.position),
          },
        })),
      })),
    };

    if (this.logicLinks.length > 0) {
      vehicle.logic_node_links = this.logicLinks.map((logicLink) => ({
        type: this.toLogicTypeAttrValue(logicLink.type),
        voxel_pos_0: createXmlVec3(logicLink.from),
        voxel_pos_1: createXmlVec3(logicLink.to),
      }));
    }

    return serializeVehicleXml(vehicle);
  }

  private toRotationAttrValue(rotation: Mat3 | Orientation | undefined) {
    let value: Mat3;
    if (rotation === undefined) {
      value = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    } else if (rotation instanceof Orientation) {
      value = rotation.toStormMat3();
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
