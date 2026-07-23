import { z } from 'zod';
import { HexColorSchema, Vec2Schema } from '~/schemas';

export const PolygonEditorMirrorSchema = z
  .object({
    enabled: z.boolean().default(false),
    axis: z.union([z.literal('x'), z.literal('y')]).default('x'),
    centerOffset: z.number().default(0),
  })
  .prefault({});

export const PolygonEditorPolygonSchema = z.object({
  id: z.number().int().nonnegative(),
  color: HexColorSchema,
  vertices: Vec2Schema.array(),
});

export const PolygonEditorValueSchema = z
  .object({
    mirror: PolygonEditorMirrorSchema,
    polygons: PolygonEditorPolygonSchema.array().default([]),
  })
  .prefault({});
