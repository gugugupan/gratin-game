import type { MapDef, MapNode, Region } from '../types';

const COLS = [1.2, 3, 4.8];
const ROWS = [2.0, 3.5, 5, 6.5, 8.0];
const SPECIAL: Record<string, MapNode['type']> = { '1-2': 'garden', '0-1': 'crate', '2-3': 'crate', '0-3': 'crate', '2-1': 'crate' };
const MEDALS = [1, 2, 2, 1];

function build(): MapDef {
  const id = (c: number, r: number) => `g${c}${r}`;
  const nodes: Record<string, MapNode> = {
    hqR: { id: 'hqR', pos: [3, 9.3], type: 'hq', hqOf: 'red' },
    hqB: { id: 'hqB', pos: [3, .7], type: 'hq', hqOf: 'blue' },
  };
  COLS.forEach((x, c) => ROWS.forEach((y, r) => {
    nodes[id(c, r)] = { id: id(c, r), pos: [x, y], type: SPECIAL[`${c}-${r}`] ?? 'base' };
  }));
  const edges: [string, string][] = [];
  for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) {
    if (c < 2) edges.push([id(c, r), id(c + 1, r)]);
    if (r < 4) edges.push([id(c, r), id(c, r + 1)]);
  }
  for (let c = 0; c < 3; c++) { edges.push(['hqR', id(c, 4)]); edges.push(['hqB', id(c, 0)]); }
  const regions: Region[] = [];
  for (let c = 0; c < 2; c++) for (let r = 0; r < 4; r++) {
    regions.push({ nodes: [id(c, r), id(c + 1, r), id(c + 1, r + 1), id(c, r + 1)], medals: MEDALS[r] });
  }
  for (let c = 0; c < 2; c++) {
    regions.push({ nodes: ['hqR', id(c, 4), id(c + 1, 4)], medals: 0 });
    regions.push({ nodes: ['hqB', id(c, 0), id(c + 1, 0)], medals: 0 });
  }
  return { id: 'block-town', width: 6, height: 10, nodes, edges, regions, objective: 6 };
}

export const BLOCK_TOWN: MapDef = build();
