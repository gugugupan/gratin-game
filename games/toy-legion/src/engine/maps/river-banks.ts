import { mirrorMap } from './mirror';

export const RIVER_BANKS = mirrorMap({
  id: 'river-banks',
  width: 6,
  height: 10,
  objective: 5,
  nodes: {
    hqR: [[3, 9.1], 'hq'],
    a1: [[1.2, 8.5], 'base'], a2: [[4.8, 8.5], 'base'],
    b1: [[.95, 7.0], 'crate'], b2: [[3, 7.4], 'base'], b3: [[5.05, 7.0], 'crate'],
    c1: [[1.8, 6.1], 'base'], c2: [[4.2, 6.1], 'base'],
    br: [[1.5, 5], 'bridge'],
    M: [[3, 5], 'garden'],
  },
  edges: [
    ['hqR', 'a1'], ['hqR', 'a2'], ['a1', 'b1'], ['a2', 'b3'], ['b1', 'b2'], ['b2', 'b3'],
    ['b1', 'c1'], ['b3', 'c2'], ['c1', 'b2'], ['b2', 'c2'], ['c1', 'br'], ['c2', "br'"], ['b2', 'M'],
  ],
  regions: [
    { nodes: ['hqR', 'a1', 'b1', 'b2', 'b3', 'a2'], medals: 0 },
    { nodes: ['b1', 'c1', 'b2'], medals: 1 },
    { nodes: ['b3', 'c2', 'b2'], medals: 1 },
    { nodes: ['br', 'c1', 'b2', 'M', "b2'", "c2'"], medals: 3 },
  ],
  selfMirrored: ['M'],
});
