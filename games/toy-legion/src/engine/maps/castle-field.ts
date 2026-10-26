import type { MapDef, MapNode, NodeType, Region } from '../types';

// Laid out landscape (red on the left) because the official board is landscape and
// 180° symmetric; only red's half is listed and the rest is mirrored, then the whole
// map is rotated to portrait with red at the bottom.
const OW = 10, OH = 6;

const LEFT_NODES: Record<string, [[number, number], NodeType]> = {
  hqR: [[1.1, 2.1], 'hq'],
  A: [[1.9, .6], 'base'], B: [[2.9, 1.9], 'base'], C: [[2.6, 3.4], 'base'], D: [[1.0, 4.3], 'base'],
  S1: [[3.8, .8], 'crate'], S2: [[3.4, 4.7], 'crate'],
  GT: [[5, .5], 'garden'], C1: [[5, 1.6], 'base'], C2: [[5, 3], 'base'],
};
const LEFT_EDGES: [string, string][] = [
  ['hqR', 'A'], ['hqR', 'B'], ['hqR', 'D'], ['A', 'S1'], ['A', 'B'], ['S1', 'C1'], ['B', 'C1'], ['B', 'C2'],
  ['B', 'C'], ['C', 'C2'], ['C', 'D'], ['C', 'S2'], ['C', 'C3'], ['D', 'S2'], ['S2', 'C3'], ['GT', 'C1'], ['C1', 'C2'],
];
const LEFT_REGIONS: Region[] = [
  { nodes: ['A', 'S1', 'C1', 'B'], medals: 1 },
  { nodes: ['B', 'C2', 'C'], medals: 3 },
  { nodes: ['C', 'C2', 'C3'], medals: 2 },
  { nodes: ['C', 'C3', 'S2'], medals: 1 },
  { nodes: ['B', 'C1', 'C2'], medals: 0 },
  { nodes: ['hqR', 'B', 'C', 'D'], medals: 0 },
  { nodes: ['hqR', 'A', 'B'], medals: 0 },
  { nodes: ['C', 'D', 'S2'], medals: 0 },
];

const MIRROR_ID: Record<string, string> = { C1: 'C3', C3: 'C1', C2: 'C2', GT: 'GB', GB: 'GT', hqR: 'hqB', hqB: 'hqR' };
const mirrorId = (id: string) => MIRROR_ID[id] ?? (id.endsWith("'") ? id.slice(0, -1) : id + "'");
const toPortrait = ([x, y]: [number, number]): [number, number] => [y, OW - x];

function build(): MapDef {
  const nodes: Record<string, MapNode> = {};
  for (const [id, [pos, type]] of Object.entries(LEFT_NODES)) {
    const m = mirrorId(id);
    nodes[id] = { id, pos: toPortrait(pos), type };
    nodes[m] = { id: m, pos: toPortrait([OW - pos[0], OH - pos[1]]), type };
  }
  nodes.hqR.hqOf = 'red';
  nodes.hqB.hqOf = 'blue';
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const [a, b] of LEFT_EDGES) {
    for (const e of [[a, b], [mirrorId(a), mirrorId(b)]] as [string, string][]) {
      const key = [...e].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(e);
    }
  }
  const regions = LEFT_REGIONS.flatMap(r => [r, { nodes: r.nodes.map(mirrorId), medals: r.medals }]);
  return { id: 'castle-field', width: OH, height: OW, nodes, edges, regions, objective: 6 };
}

export const CASTLE_FIELD: MapDef = build();
