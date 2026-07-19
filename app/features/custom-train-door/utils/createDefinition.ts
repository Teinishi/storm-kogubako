import type { TrainDoorState } from '../types';
import { DefinitionBuilder } from './definitionBuilder';

export interface CreateVisualDefinitionOptions {
  staticMesh?: string;
  meshes?: string[];
  luaFilename: string;
}

export function createVisualDefinition(
  state: DeepReadonly<TrainDoorState>,
  options?: DeepReadonly<CreateVisualDefinitionOptions>,
) {
  const { doorWidth, doorHeight } = state;
  const z2 = Math.floor(doorWidth / 2);
  const z1 = z2 - doorWidth + 1;
  const y1 = -Math.floor(doorHeight / 2);
  const y2 = y1 + doorHeight - 1;

  const builder = new DefinitionBuilder();

  builder.addAttribute('name', '(M) Train Door');
  builder.addAttribute('category', 2);
  builder.addAttribute('type', 66);
  builder.addAttribute('mass', doorWidth * doorHeight * 0.5);
  builder.addAttribute('value', 40);
  builder.addAttribute('flags', 0);
  builder.addAttribute('tags', 'mod,train,door');
  builder.addAttribute('mesh_data_name', options?.staticMesh);
  for (let i = 0; i < 3; i++) {
    builder.addAttribute(`mesh_${i}_name`, options?.meshes?.at(i));
  }
  builder.addAttribute('lua_filename', options?.luaFilename);

  builder.addSurfaces(
    { x: 0, y: y2, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 2, shape: 0 },
  );
  builder.addSurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y1, z: z2 },
    { orientation: 3, shape: 0 },
  );
  builder.addSurfaces(
    { x: 0, y: y1, z: z2 },
    { x: 0, y: y2, z: z2 },
    { orientation: 4, shape: 0 },
  );
  builder.addSurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z1 },
    { orientation: 5, shape: 0 },
  );

  builder.addBuoyancySurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 0, shape: 1 },
  );
  builder.addBuoyancySurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 1, shape: 1 },
  );

  builder.addVoxels(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { flags: 0 },
  );

  return builder.writeXml();
}
