import type { Level } from '../core/engine';

export interface RecipeEdge { from: string; to: string; tag?: string; value?: number }

/** 从 SUPPLIED_BY 条件推出生产树：边 = 供料设施 → 制造设施；depth = 离原料的最长距离 */
export function recipeGraph(level: Level) {
  const edges: RecipeEdge[] = [];
  for (const r of level.regions)
    for (const c of r.constraints || [])
      if (c.type === 'SUPPLIED_BY') edges.push({ from: c.params!.region, to: r.id, tag: c.params!.tag, value: c.params!.value });
  const nodes = level.regions.filter((r) => r.facility || edges.some((e) => e.from === r.id || e.to === r.id)).map((r) => r.id);
  const depth = new Map<string, number>();
  const dfs = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const ins = edges.filter((e) => e.to === id);
    const d = ins.length ? 1 + Math.max(...ins.map((e) => dfs(e.from, seen))) : 0;
    depth.set(id, d);
    return d;
  };
  nodes.forEach((n) => dfs(n));
  return { nodes, edges, depth };
}
