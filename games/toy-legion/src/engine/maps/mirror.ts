import type { MapDef, MapNode, NodeType, Region } from '../types';

export interface HalfMap {
  id: string;
  width: number;
  height: number;
  objective: number;
  nodes: Record<string, [[number, number], NodeType]>;
  edges: [string, string][];
  regions: Region[];
  selfMirrored?: string[];
}

// Red's half is authored in portrait board units (red at the bottom); the other half is
// the 180° rotation, so every map is fair for both sides.
export function mirrorMap(h: HalfMap): MapDef {
  const self = new Set(h.selfMirrored ?? []);
  const mirrorId = (id: string) => id === 'hqR' ? 'hqB' : id === 'hqB' ? 'hqR' : self.has(id) ? id : id.endsWith("'") ? id.slice(0, -1) : id + "'";
  const nodes: Record<string, MapNode> = {};
  for (const [id, [[x, y], type]] of Object.entries(h.nodes)) {
    nodes[id] = { id, pos: [x, y], type };
    const m = mirrorId(id);
    if (!nodes[m]) nodes[m] = { id: m, pos: [h.width - x, h.height - y], type };
  }
  nodes.hqR.hqOf = 'red';
  nodes.hqB.hqOf = 'blue';
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const [a, b] of h.edges) {
    for (const e of [[a, b], [mirrorId(a), mirrorId(b)]] as [string, string][]) {
      const key = [...e].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(e);
    }
  }
  const regionKey = (r: Region) => [...r.nodes].sort().join('|');
  const regions: Region[] = [];
  const seenRegions = new Set<string>();
  for (const r of h.regions) {
    for (const reg of [r, { nodes: r.nodes.map(mirrorId), medals: r.medals }]) {
      if (seenRegions.has(regionKey(reg))) continue;
      seenRegions.add(regionKey(reg));
      regions.push(reg);
    }
  }
  return { id: h.id, width: h.width, height: h.height, nodes, edges, regions, objective: h.objective };
}
