import { z } from 'zod';
import { PolygonEditorValueSchema } from '~/features/polygon-editor';
import { HexColorSchema } from '~/schemas';

export const DoorTypeSchema = z.union([z.literal('sliding')]);
export const DirectionSchema = z.union([
  z.literal('double'),
  z.literal('left'),
  z.literal('right'),
]);

export const TrainDoorOptionsSchema = z
  .object({
    doorType: DoorTypeSchema.default('sliding'),
    direction: DirectionSchema.default('double'),
    doorWidth: z.number().int().gte(1).default(6),
    doorHeight: z.number().int().gte(1).default(8),
    doorThickness: z.number().positive().default(0.1),
    doorZOffset: z.number().default(0),
    outsideColor: HexColorSchema.default('#c2c3c7'),
    insideColor: HexColorSchema.default('#c2c3c7'),
    rubberThickness: z.number().nonnegative().default(0.02),
    rubberColor: HexColorSchema.default('#545454'),
    windowXOffset: z.number().default(0),
    windowYOffset: z.number().default(0.125),
    windowWidth: z.number().positive().default(0.5),
    windowHeight: z.number().positive().default(1),
    windowCornerRadius: z.number().nonnegative().default(0.08),
    windowCornerDivisions: z.number().int().positive().default(1),
    windowFrameThickness: z.number().nonnegative().default(0.02),
    windowFrameColor: HexColorSchema.default('#545454'),
  })
  .prefault({});

export const EditTrainDoorStateSchema = z
  .object({
    options: TrainDoorOptionsSchema,
    outsidePaint: PolygonEditorValueSchema,
    insidePaint: PolygonEditorValueSchema,
  })
  .prefault({});
