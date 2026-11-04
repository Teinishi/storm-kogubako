import type { ComponentDefinition, ComponentDefinitionSchemas } from '@sw-file-lib/xml';
import type { StrictOmit } from 'ts-essentials';

type SurfaceImmutable = ComponentDefinitionSchemas.SurfaceImmutable;
type VoxelImmutable = ComponentDefinitionSchemas.VoxelImmutable;

function forCuboidSurfaces(
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  callback: (from: Vec3, to: Vec3, orientation: number) => void,
) {
  const min = minVec3(from, to);
  const max = maxVec3(from, to);
  callback({ ...min, x: max.x }, max, 0);
  callback(min, { ...max, x: min.x }, 1);
  callback({ ...min, y: max.y }, max, 2);
  callback(min, { ...max, y: min.y }, 3);
  callback({ ...min, z: max.z }, max, 4);
  callback(min, { ...max, z: min.z }, 5);
}

function createSurfaces(
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  options?: Readonly<StrictOmit<SurfaceImmutable, 'position'>>,
) {
  const surfaces: SurfaceImmutable[] = [];
  forVoxels(from, to, (position) => {
    surfaces.push({
      position: createXmlVec3(position),
      ...options,
    });
  });
  return surfaces;
}

function getVoxelBounds(voxels: { readonly position?: Partial<Readonly<Vec3>> }[]) {
  let min, max;

  for (const { position } of voxels) {
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

function hasPhysics(voxel: VoxelImmutable) {
  return ((voxel.flags ?? 0) & 1) !== 0;
}

export function createSurfacesCuboid(
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  orientations: number[],
  options?: Readonly<StrictOmit<SurfaceImmutable, 'position' | 'orientation'>>,
) {
  const surfaces: SurfaceImmutable[] = [];
  forCuboidSurfaces(from, to, (a, b, orientation) => {
    if (!orientations.includes(orientation)) return;
    surfaces.push(
      ...createSurfaces(a, b, {
        ...(orientation !== 0 ? { orientation } : {}),
        ...options,
      }),
    );
  });
  return surfaces;
}

export function createVoxels(
  from: Readonly<Vec3>,
  to: Readonly<Vec3>,
  options?: Readonly<StrictOmit<VoxelImmutable, 'position'>>,
) {
  const voxels: VoxelImmutable[] = [];
  forVoxels(from, to, (position) => {
    voxels.push({
      position: createXmlVec3(position),
      ...options,
    });
  });
  return voxels;
}

export function completeDefinition(definition: ComponentDefinition) {
  const voxelBounds = getVoxelBounds(definition.voxels ?? []);
  if (voxelBounds) {
    if (definition.voxel_min === undefined) {
      definition.voxel_min = createXmlVec3(voxelBounds.min);
    }
    if (definition.voxel_max === undefined) {
      definition.voxel_max = createXmlVec3(voxelBounds.max);
    }
  }

  const voxelPhysicsBounds = getVoxelBounds((definition.voxels ?? []).filter(hasPhysics));
  if (voxelPhysicsBounds) {
    if (definition.voxel_physics_min === undefined) {
      definition.voxel_physics_min = createXmlVec3(voxelPhysicsBounds.min);
    }
    if (definition.voxel_physics_max === undefined) {
      definition.voxel_physics_max = createXmlVec3(voxelPhysicsBounds.max);
    }
  }

  return definition;
}
