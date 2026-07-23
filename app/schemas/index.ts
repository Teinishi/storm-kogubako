import { z } from 'zod';

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: 'Invalid color format. Must be a 7-character hex code (e.g., #RRGGBB).',
});

export const Vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});
