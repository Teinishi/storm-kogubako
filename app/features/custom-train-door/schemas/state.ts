import { z } from 'zod';
import { PolygonEditorValueSchema } from '~/features/polygon-editor';
import { HexColorSchema } from '~/schemas';

export const DoorTypeSchema = z.union([z.literal('sliding')]);
export const DirectionSchema = z.union([
  z.literal('double'),
  z.literal('left'),
  z.literal('right'),
]);

export const TrainDoorOptionsSchema = z.object({
  doorType: DoorTypeSchema,
  direction: DirectionSchema,
  doorWidth: z.number().int().gte(1),
  doorHeight: z.number().int().gte(1),
  doorThickness: z.number().positive(),
  doorZOffset: z.number(),
  outsideColor: HexColorSchema,
  insideColor: HexColorSchema,
  rubberThickness: z.number().nonnegative(),
  rubberColor: HexColorSchema,
  windowXOffset: z.number(),
  windowYOffset: z.number(),
  windowWidth: z.number().positive(),
  windowHeight: z.number().positive(),
  windowCornerRadius: z.number().nonnegative(),
  windowCornerDivisions: z.number().int().positive(),
  windowFrameThickness: z.number().nonnegative(),
  windowFrameColor: HexColorSchema,
});

export const EditTrainDoorStateSchema = z.object({
  options: TrainDoorOptionsSchema,
  outsidePaint: PolygonEditorValueSchema,
  insidePaint: PolygonEditorValueSchema,
});
