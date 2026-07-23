import { xxHash32 } from 'js-xxhash';
import { z } from 'zod';
import { EditTrainDoorStateSchema } from '../schemas';
import type { EditTrainDoorState } from '../types';

const StorageSchema = z.object({
  version: z.number().int().nonnegative(),
  data: EditTrainDoorStateSchema,
});

const CURRENT_VERSION = 0;

export function toJson(state: EditTrainDoorState, pretty?: boolean) {
  return JSON.stringify(
    {
      version: CURRENT_VERSION,
      data: state,
    },
    null,
    pretty ? 4 : undefined,
  );
}

export function fromJson(raw: string) {
  const _rawData = StorageSchema.parse(JSON.parse(raw));
}

export function getFingerprint(jsonStr: string) {
  return xxHash32(jsonStr).toString(16);
}
