import type { StrictOmit } from 'ts-essentials';

export interface Surface {
  position?: Vec3;
  orientation?: number;
  shape?: number;
  rotation?: number;
  transType?: number;
  flags?: number;
  isReverseNormals?: boolean;
  isTwoSided?: boolean;
}

export interface LogicNode {
  position?: Vec3;
  orientation?: number;
  label?: string;
  mode?: number;
  nodeType?: number;
  description?: string;
}

export interface Voxel {
  position?: Vec3;
  // physicsShapeRotation?: Mat4;
  flags?: number;
  physicsShape?: number;
  buoyPipes?: number;
}

function vec3ToAttrs(value: Vec3) {
  return [
    { name: 'x', value: value.x },
    { name: 'y', value: value.y },
    { name: 'z', value: value.z },
  ];
}

function splitAttrsAndChildrenOfSurface(surface: DeepReadonly<Surface>) {
  return {
    attrs: [
      { name: 'orientation', value: surface.orientation },
      { name: 'shape', value: surface.shape },
      { name: 'rotation', value: surface.rotation },
      { name: 'trans_type', value: surface.transType },
      { name: 'flags', value: surface.flags },
      { name: 'is_reverse_normals', value: surface.isReverseNormals },
      { name: 'is_two_sided', value: surface.isTwoSided },
    ],
    children: surface.position ? [{ tagName: 'position', attrs: vec3ToAttrs(surface.position) }] : [],
  };
}

function splitAttrsAndChildrenOfLogicNode(logicNode: DeepReadonly<LogicNode>) {
  return {
    attrs: [
      { name: 'orientation', value: logicNode.orientation },
      { name: 'label', value: logicNode.label },
      { name: 'mode', value: logicNode.mode },
      { name: 'node_type', value: logicNode.nodeType },
      { name: 'description', value: logicNode.description },
    ],
    children: logicNode.position ? [{ tagName: 'position', attrs: vec3ToAttrs(logicNode.position) }] : [],
  };
}

function splitAttrsAndChildrenOfVoxel(voxel: DeepReadonly<Voxel>) {
  return {
    attrs: [
      { name: 'flags', value: voxel.flags },
      { name: 'physicsShape', value: voxel.physicsShape },
      { name: 'buoyPipes', value: voxel.buoyPipes },
    ],
    children: voxel.position ? [{ tagName: 'position', attrs: vec3ToAttrs(voxel.position) }] : [],
  };
}

export class DefinitionBuilder {
  private attrs: XmlAttribute[] = [];
  private surfaces: Surface[] = [];
  private buoyancySurfaces: Surface[] = [];
  private logicNodes: LogicNode[] = [];
  private voxels: Voxel[] = [];
  private elements: { tagName: string; attrs: DeepReadonly<XmlAttribute[]> }[] = [];

  addAttribute(name: string, value: XmlAttribute['value']) {
    this.attrs.push({ name, value });
  }

  addSurfaces(
    from: Readonly<Vec3>,
    to: Readonly<Vec3>,
    options?: Readonly<StrictOmit<Surface, 'position'>>,
  ) {
    this.forVoxels(from, to, (position) => {
      this.surfaces.push({
        position,
        ...options,
      });
    });
  }

  addBuoyancySurfaces(
    from: Readonly<Vec3>,
    to: Readonly<Vec3>,
    options?: Readonly<StrictOmit<Surface, 'position'>>,
  ) {
    this.forVoxels(from, to, (position) => {
      this.buoyancySurfaces.push({
        position,
        ...options,
      });
    });
  }

  addLogicNode(logicNode: DeepReadonly<LogicNode>) {
    this.logicNodes.push(logicNode);
  }

  addVoxels(
    from: Readonly<Vec3>,
    to: Readonly<Vec3>,
    options?: Readonly<StrictOmit<Voxel, 'position'>>,
  ) {
    this.forVoxels(from, to, (position) => {
      this.voxels.push({
        position,
        ...options,
      });
    });
  }

  private forVoxels(from: Readonly<Vec3>, to: Readonly<Vec3>, callback: (position: Vec3) => void) {
    const x1 = Math.min(from.x, to.x);
    const x2 = Math.max(from.x, to.x);
    const y1 = Math.min(from.y, to.y);
    const y2 = Math.max(from.y, to.y);
    const z1 = Math.min(from.z, to.z);
    const z2 = Math.max(from.z, to.z);

    for (let z = z1; z <= z2; z++) {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          callback({ x, y, z });
        }
      }
    }
  }

  addElement(tagName: string, attrs: DeepReadonly<XmlAttribute[]>) {
    this.elements.push({ tagName, attrs });
  }

  writeXml() {
    const writer = new XmlWriter();

    writer.begin('definition', this.attrs);

    this.writeList(writer, 'surfaces', 'surface', this.surfaces.map(splitAttrsAndChildrenOfSurface));
    this.writeList(writer, 'buoyancy_surfaces', 'surface', this.buoyancySurfaces.map(splitAttrsAndChildrenOfSurface));
    this.writeList(writer, 'logic_nodes', 'logic_node', this.logicNodes.map(splitAttrsAndChildrenOfLogicNode));
    this.writeList(writer, 'voxels', 'voxel', this.voxels.map(splitAttrsAndChildrenOfVoxel));

    const voxelRange = this.getVoxelRange();
    if (voxelRange) {
      if (this.elements.findIndex(e => e.tagName === 'voxel_min') === -1) {
        writer.empty('voxel_min', vec3ToAttrs(voxelRange.min));
      }
      if (this.elements.findIndex(e => e.tagName === 'voxel_max') === -1) {
        writer.empty('voxel_max', vec3ToAttrs(voxelRange.max));
      }
    }

    for (const element of this.elements) {
      writer.empty(element.tagName, element.attrs);
    }

    writer.end('definition');

    return writer.toString();
  }

  private writeList(
    writer: XmlWriter,
    listName: string,
    itemName: string,
    items: DeepReadonly<{ attrs?: XmlAttribute[]; children?: { tagName: string; attrs: XmlAttribute[] }[] }[]>,
  ) {
    if (items.length == 0) return;

    writer.begin(listName);

    for (const { attrs, children } of items) {
      if (!children || children.length === 0) {
        writer.empty(itemName, attrs);
      }
      else {
        writer.begin(itemName, attrs);
        for (const child of children) {
          writer.empty(child.tagName, child.attrs);
        }
        writer.end(itemName);
      }
    }

    writer.end(listName);
  }

  private getVoxelRange() {
    let min, max;

    for (const { position } of this.voxels) {
      const x = position?.x ?? 0;
      const y = position?.y ?? 0;
      const z = position?.z ?? 0;

      if (min === undefined) min = { x, y, z };
      else {
        min.x = Math.min(min.x, x);
        min.y = Math.min(min.y, y);
        min.z = Math.min(min.z, z);
      }
      if (max === undefined) max = { x, y, z };
      else {
        max.x = Math.max(max.x, x);
        max.y = Math.max(max.y, y);
        max.z = Math.max(max.z, z);
      }
    }

    if (min === undefined || max === undefined) return null;
    return { min, max };
  }
}
