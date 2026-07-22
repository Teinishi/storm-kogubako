import { xxHash32 } from 'js-xxhash';
import type { PolygonEditorValue } from '~/features/polygon-editor';
import type { TrainDoorState } from '../types';

const VERSION = 0;

export interface SessionState {
  state: TrainDoorState;
  outsidePolygonEditorValue: PolygonEditorValue;
  insidePolygonEditorValue: PolygonEditorValue;
}

export function toJson(sessionState: SessionState, pretty?: boolean) {
  return JSON.stringify(
    {
      version: VERSION,
      state: sessionState.state,
      outsidePolygonEditorValue: sessionState.outsidePolygonEditorValue,
      insidePolygonEditorValue: sessionState.insidePolygonEditorValue,
    },
    null,
    pretty ? 4 : undefined,
  );
}

// todo: fromJSON

export function getFingerprint(jsonStr: string) {
  return xxHash32(jsonStr).toString(16);
}
