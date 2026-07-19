import type { MeshVec3, MeshColor4, MeshVertex, SubMesh, MeshFile } from 'sw-mesh-viewer/parser';

export function createMeshFile(data: DeepReadonly<MeshFile>) {
  const writer = new BinaryWriter();
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

class BinaryWriter {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset = 0;
  private textEncoder: TextEncoder;

  constructor(size = 1024) {
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
    this.textEncoder = new TextEncoder();
  }

  private ensure(size: number) {
    if (this.offset + size <= this.buffer.byteLength) return;

    let newSize = this.buffer.byteLength;
    while (newSize < this.offset + size) {
      newSize *= 2;
    }

    const newBuffer = new ArrayBuffer(newSize);
    new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));

    this.buffer = newBuffer;
    this.view = new DataView(newBuffer);
  }

  uint8(v: number) {
    this.ensure(1);
    this.view.setUint8(this.offset, v);
    this.offset += 1;
  }

  uint16(v: number, little = true) {
    this.ensure(2);
    this.view.setUint16(this.offset, v, little);
    this.offset += 2;
  }

  uint32(v: number, little = true) {
    this.ensure(4);
    this.view.setUint32(this.offset, v, little);
    this.offset += 4;
  }

  float32(v: number, little = true) {
    this.ensure(4);
    this.view.setFloat32(this.offset, v, little);
    this.offset += 4;
  }

  ascii(text: string) {
    this.ensure(text.length);
    for (let i = 0; i < text.length; i++) {
      this.view.setUint8(this.offset++, text.charCodeAt(i) & 0x7f);
    }
  }

  utf8(text: string) {
    const bytes = this.textEncoder.encode(text);
    this.uint16(bytes.length);
    this.bytes(bytes);
  }

  bytes(data: Uint8Array) {
    this.ensure(data.length);
    new Uint8Array(this.buffer, this.offset, data.length).set(data);
    this.offset += data.length;
  }

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
    this.utf8(data.name);

    this.vec3({ x: 1, y: 1, z: 1 });
  }

  toUint8Array() {
    return new Uint8Array(this.buffer, 0, this.offset);
  }
}
