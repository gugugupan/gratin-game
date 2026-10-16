import type { GardenMap } from './engine';

export interface Level {
  id: string;
  map: GardenMap;
}

export const LEVELS: Level[] = [
  {
    id: 'g1',
    map: { cols: 4, rows: 3, rocks: [], entry: { cell: [0, 2], side: 'W' }, exit: { cell: [3, 0], side: 'E' } },
  },
  {
    id: 'g2',
    map: { cols: 5, rows: 4, rocks: [[2, 1]], entry: { cell: [0, 3], side: 'W' }, exit: { cell: [4, 0], side: 'E' } },
  },
  {
    id: 'g3',
    map: {
      cols: 7,
      rows: 5,
      rocks: [
        [1, 1],
        [5, 3],
      ],
      entry: { cell: [0, 4], side: 'W' },
      exit: { cell: [6, 1], side: 'E' },
    },
  },
];
