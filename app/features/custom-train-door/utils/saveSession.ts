import { xxHash32 } from 'js-xxhash';
import type { EditTrainDoorState } from '../types';

const VERSION = 0;

export function toJson(sessionState: EditTrainDoorState, pretty?: boolean) {
  return JSON.stringify(
    {
      version: VERSION,
      data: sessionState,
    },
    null,
    pretty ? 4 : undefined,
  );
}

// todo: fromJSON

export function getFingerprint(jsonStr: string) {
  return xxHash32(jsonStr).toString(16);
}
