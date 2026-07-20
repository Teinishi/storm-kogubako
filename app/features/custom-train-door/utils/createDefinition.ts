import type { TrainDoorState } from '../types';
import { DefinitionBuilder } from './definitionBuilder';

export interface CreateVisualDefinitionOptions {
  staticMesh?: string;
  meshes?: string[];
  luaFilename: string;
}

export function createVisualDefinition(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
  options?: DeepReadonly<CreateVisualDefinitionOptions>,
) {
  const { doorWidth, doorHeight } = state;
  const z2 = Math.floor(doorWidth / 2);
  const z1 = z2 - doorWidth + 1;
  const y1 = -Math.floor(doorHeight / 2);
  const y2 = y1 + doorHeight - 1;

  const builder = new DefinitionBuilder();

  builder.addAttribute('name', `(M) Train Door Visual ${fingerprint}`);
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
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 0, shape: 0 },
  );
  builder.addSurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 1, shape: 0 },
  );
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
    { flags: 4 },
  );

  builder.addLogicNode({
    label: 'Position',
    mode: 1,
    type: 1,
    description: 'Controls the position of the door with the value between 0 and 1.',
  });

  builder.addElement(
    'tooltip_properties',
    [{
      name: 'short_description',
      value: 'Sliding door that can be opened and closed using a number input.',
    }],
  );

  return builder.writeXml();
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateCollisionDefinitionOptions {}

export function createCollisionDefinition(
  state: DeepReadonly<TrainDoorState>,
  fingerprint: string,
  _options?: DeepReadonly<CreateCollisionDefinitionOptions>,
) {
  const width = state.doorWidth / 2;
  const height = state.doorHeight;
  const z2 = Math.floor(width / 2);
  const z1 = z2 - width + 1;
  const y1 = -Math.floor(height / 2);
  const y2 = y1 + height - 1;

  const builder = new DefinitionBuilder();

  builder.addAttribute('name', `(M) Train Door Collision ${fingerprint}`);
  builder.addAttribute('category', 2);
  builder.addAttribute('type', 13);
  builder.addAttribute('mass', width * height * 0.5);
  builder.addAttribute('value', 40);
  builder.addAttribute('flags', 1);
  builder.addAttribute('tags', 'mod,train,door');
  builder.addAttribute('mesh_0_name', 'meshes/m_tns_train_door_test_2.mesh');
  builder.addAttribute('door_lower_limit', 0);
  builder.addAttribute('door_upper_limit', width);
  builder.addAttribute('door_flipped', false);
  builder.addAttribute('door_side_dist', width);
  builder.addAttribute('door_up_dist', height - 1);

  builder.addElement('door_size', vec3ToAttrs({ x: 0.5, y: height, z: width }));
  builder.addElement('door_normal', vec3ToAttrs({ x: -1, y: 0, z: 0 }));
  builder.addElement('door_side', vec3ToAttrs({ x: 0, y: 0, z: 1 }));
  builder.addElement('door_up', vec3ToAttrs({ x: 0, y: 1, z: 0 }));
  builder.addElement('door_base_pos', vec3ToAttrs({ x: 0, y: -4, z: 1 }));

  builder.addSurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 0, shape: 0 },
  );
  builder.addSurfaces(
    { x: 0, y: y1, z: z1 },
    { x: 0, y: y2, z: z2 },
    { orientation: 1, shape: 0 },
  );
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
    { flags: 4 },
  );

  builder.addLogicNode({
    position: { x: 0, y: 1, z: 0 },
    label: 'Open/Close',
    mode: 1,
    type: 0,
    description: 'Opens the door when receiving an on signal, and closes it when receiving an off signal.',
  });
  builder.addLogicNode({
    label: 'Electric',
    mode: 1,
    type: 4,
    description: 'Electrical power connection.',
  });

  builder.addElement(
    'tooltip_properties',
    [{
      name: 'short_description',
      value: 'Sliding door that can be opened and closed using an on/off signal.',
    }],
  );

  return builder.writeXml();
}
