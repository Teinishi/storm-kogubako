import {
  createDefaultPolygonEditorValue,
  type PolygonEditorPolygon,
  type PolygonEditorValue,
} from '~/features/polygon-editor';

export type DoorTypes = 'sliding';

export interface TrainDoorOptions {
  doorType: DoorTypes;
  direction: 'double' | 'left' | 'right';
  doorWidth: number;
  doorHeight: number;
  doorThickness: number;
  doorZOffset: number;
  outsideColor: string;
  insideColor: string;
  rubberThickness: number;
  rubberColor: string;
  windowXOffset: number;
  windowYOffset: number;
  windowWidth: number;
  windowHeight: number;
  windowCornerRadius: number;
  windowCornerDivisions: number;
  windowFrameThickness: number;
  windowFrameColor: string;
}

export interface EditTrainDoorState {
  options: TrainDoorOptions;
  outsidePaint: PolygonEditorValue;
  insidePaint: PolygonEditorValue;
}

export interface OutputTrainDoorState {
  options: TrainDoorOptions;
  outsidePaint: PolygonEditorPolygon[];
  insidePaint: PolygonEditorPolygon[];
}

export function createDefaultTrainDoorOptions(): TrainDoorOptions {
  return {
    doorType: 'sliding',
    direction: 'double',
    doorWidth: 6,
    doorHeight: 8,
    doorThickness: 0.1,
    doorZOffset: 0,
    outsideColor: '#c2c3c7',
    insideColor: '#c2c3c7',
    rubberThickness: 0.02,
    rubberColor: '#545454',
    windowXOffset: 0,
    windowYOffset: 0.125,
    windowWidth: 0.5,
    windowHeight: 1,
    windowCornerRadius: 0.08,
    windowCornerDivisions: 1,
    windowFrameThickness: 0.02,
    windowFrameColor: '#545454',
  };
}

export function createDefaultEditTrainDoorState(): EditTrainDoorState {
  return {
    options: createDefaultTrainDoorOptions(),
    outsidePaint: createDefaultPolygonEditorValue(),
    insidePaint: createDefaultPolygonEditorValue(),
  };
}
