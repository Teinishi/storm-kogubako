export type DoorTypes = 'double_sliding' | 'single_sliding_left' | 'single_sliding_right';

export interface TrainDoorState {
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

export function createDefaultTrainDoorState(): TrainDoorState {
  return {
    doorType: 'double_sliding',
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
