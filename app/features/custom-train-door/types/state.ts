import type { z } from 'zod';
import type { PolygonEditorPolygon } from '~/features/polygon-editor';
import { EditTrainDoorStateSchema, TrainDoorOptionsSchema } from '../schemas';

export type TrainDoorOptions = z.infer<typeof TrainDoorOptionsSchema>;

export type EditTrainDoorState = z.infer<typeof EditTrainDoorStateSchema>;

export interface OutputTrainDoorState {
  options: TrainDoorOptions;
  outsidePaint: PolygonEditorPolygon[];
  insidePaint: PolygonEditorPolygon[];
}

export function createDefaultTrainDoorOptions(): TrainDoorOptions {
  return TrainDoorOptionsSchema.parse(undefined);
}

export function createDefaultEditTrainDoorState(): EditTrainDoorState {
  return EditTrainDoorStateSchema.parse(undefined);
}
