import type { MeshVec3, MeshColor4, MeshVertex, SubMesh, MeshFile } from 'sw-mesh-viewer/parser';

export function createMeshFile(data: DeepReadonly<MeshFile>) {
  const writer = new MeshWriter();
  writer.ascii('mesh');
  writer.uint16(7);
  writer.uint16(1);
  writer.uint16(data.vertices.length);
  writer.uint16(19);
  writer.uint16(0);

  for (const vertex of data.vertices) {
    writer.vertex(vertex);
  }

  writer.uint32(data.indices.length);
  for (const i of data.indices) {
    writer.uint16(i);
  }

  writer.uint16(data.submeshes.length);
  for (const submesh of data.submeshes) {
    writer.submesh(submesh);
  }

  writer.uint16(0);

  return writer.toUint8Array();
}

class MeshWriter extends BinaryWriter {
  vec3(data: Readonly<MeshVec3>) {
    this.float32(data.x);
    this.float32(data.y);
    this.float32(data.z);
  }

  color4(data: Readonly<MeshColor4>) {
    this.uint8(data.r);
    this.uint8(data.g);
    this.uint8(data.b);
    this.uint8(data.a);
  }

  vertex(vertex: DeepReadonly<MeshVertex>) {
    this.vec3(vertex.position);
    this.color4(vertex.color);
    this.vec3(vertex.normal);
  }

  submesh(data: DeepReadonly<SubMesh>) {
    this.uint32(data.indexBufferStart);
    this.uint32(data.indexBufferLength);
    this.uint16(0);
    this.uint16(data.shaderId);

    this.vec3(data.boundsMin);
    this.vec3(data.boundsMax);

    this.uint16(0);
    this.withSize(2, (writer) => writer.utf8(data.name));

    this.vec3({ x: 1, y: 1, z: 1 });
  }
}
