import type { GardenMap } from './engine';

export interface Level {
  id: string;
  name: string;
  hint: string;
  map: GardenMap;
}

export const LEVELS: Level[] = [
  {
    id: 'g1',
    name: '其一　初耙',
    hint: '直着耙过的格子会整洁如新；转弯只扫过一个扇形。',
    map: { cols: 4, rows: 3, rocks: [], entry: { cell: [0, 2], side: 'W' }, exit: { cell: [3, 0], side: 'E' } },
  },
  {
    id: 'g2',
    name: '其二　一石',
    hint: '转弯外侧的角落会留着乱砂，换个方向再转一次就能补上。',
    map: { cols: 5, rows: 4, rocks: [[2, 1]], entry: { cell: [0, 3], side: 'W' }, exit: { cell: [4, 0], side: 'E' } },
  },
  {
    id: 'g3',
    name: '其三　方丈前庭',
    hint: '两组石头，先想好哪里直耙、哪里绕行。',
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
