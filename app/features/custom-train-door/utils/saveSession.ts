import { xxHash32 } from 'js-xxhash';
import { z } from 'zod';
import { EditTrainDoorStateSchema } from '../schemas';
import type { EditTrainDoorState } from '../types';

const CURRENT_VERSION = 0;

const KnownVersionSchema = z.union([z.literal(0)]);

const StorageSchema = z.object({
  version: KnownVersionSchema,
  data: z.any(),
});

export function fromJson(raw: string) {
  const rawData = StorageSchema.parse(JSON.parse(raw));

  // バージョンを変更したら migrate 処理を追加

  const data = EditTrainDoorStateSchema.parse(rawData.data);
  return data;
}

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

export function getFingerprint(jsonStr: string) {
  return xxHash32(jsonStr).toString(16);
}
