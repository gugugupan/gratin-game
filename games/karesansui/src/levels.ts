import type { Cell, GardenMap } from './engine';
import data from './levels.json';

export interface Level {
  id: string;
  map: GardenMap;
  /** The raking path whose final pattern is the level's target. */
  solution: Cell[];
}

export const LEVELS = data as unknown as Level[];
