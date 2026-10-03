import { useLayoutEffect, useState } from 'react';
import type { Level } from '../core/engine';
import { recipeGraph } from './recipe';

const TILE = `${import.meta.env.BASE_URL}tiles/`;
const HOP = 0.9; // 每一级流水线的延迟（秒）
const TRAVEL = 1.4; // 物资走完一段流水线的时间（秒）

interface Flow { path: string; icon: string; delay: number }

/** 通关后，物资沿流水线从供料设施流向制造设施，最后在成品设施上冒出成品；循环播放，表示流水线一直在运转 */
export function FlowOverlay({ level, assignment, board }: { level: Level; assignment: Record<number, string>; board: HTMLDivElement | null }) {
  const [state, setState] = useState<{ w: number; h: number; flows: Flow[]; goal?: { x: number; y: number; delay: number } } | null>(null);

  useLayoutEffect(() => {
    if (!board) return;
    const base = board.getBoundingClientRect();
    const center = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 }; };
    const cellsOf = (rid: string) => Object.entries(assignment).filter(([, r]) => r === rid).map(([id]) => board.querySelector(`.cell[data-id="${id}"]`)).filter(Boolean) as Element[];
    const mid = (els: Element[]) => { const ps = els.map(center); return { x: ps.reduce((m, p) => m + p.x, 0) / ps.length, y: ps.reduce((m, p) => m + p.y, 0) / ps.length }; };
    const byId = new Map(level.board.cells.map((c) => [c.id, c]));
    const { edges, depth } = recipeGraph(level);
    const flows: Flow[] = [];
    for (const e of edges) {
      const a = cellsOf(e.from), b = cellsOf(e.to);
      if (!a.length || !b.length) continue;
      // 两区域的接缝：取相邻格子对的中点
      const seams: Array<{ x: number; y: number }> = [];
      for (const ea of a) for (const eb of b) {
        const ca = byId.get(Number((ea as HTMLElement).dataset.id))!, cb = byId.get(Number((eb as HTMLElement).dataset.id))!;
        if (Math.abs(ca.x - cb.x) + Math.abs(ca.y - cb.y) === 1) { const p1 = center(ea), p2 = center(eb); seams.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }); }
      }
      if (!seams.length) continue;
      const s = seams[Math.floor(seams.length / 2)], p = mid(a), q = mid(b);
      const fromReg = level.regions.find((r) => r.id === e.from);
      const icon = e.tag ? `${TILE}terrain-${e.tag}.svg` : `${TILE}role-${fromReg?.owner.icon}.svg`;
      flows.push({ path: `M${p.x},${p.y} L${s.x},${s.y} L${q.x},${q.y}`, icon, delay: (depth.get(e.from) ?? 0) * HOP });
    }
    const product = level.product;
    let goal;
    if (product) {
      const g = cellsOf(product.goal);
      if (g.length) goal = { ...mid(g), delay: Math.max(0, ...[...depth.values()]) * HOP + TRAVEL };
    }
    setState({ w: base.width, h: base.height, flows, goal });
  }, [level, assignment, board]);

  if (!state) return null;
  const size = Math.min(state.w, state.h) / 10;
  // 流水线循环：每一圈里各级物资按顺序出发、到站，最后成品跳一下，然后重新开始
  const cycle = (state.goal?.delay ?? 0) + TRAVEL + 0.8;
  const r = (t: number) => Math.min(1, Math.max(0, t / cycle)).toFixed(4);
  return (
    <svg className="flow-overlay" viewBox={`0 0 ${state.w} ${state.h}`} aria-hidden="true">
      {state.flows.map((f, i) => {
        const a = r(f.delay), b = r(f.delay + TRAVEL);
        return (
          <g key={i}>
            <path d={f.path} className="flow-path" />
            <image href={f.icon} width={size} height={size} x={-size / 2} y={-size / 2} opacity="0">
              <animateMotion path={f.path} dur={`${cycle}s`} repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes={`0;${a};${b};1`} />
              <animate attributeName="opacity" dur={`${cycle}s`} repeatCount="indefinite" values="0;0;1;1;0;0"
                keyTimes={`0;${a};${r(f.delay + 0.1)};${r(f.delay + TRAVEL - 0.1)};${b};1`} />
            </image>
          </g>
        );
      })}
      {state.goal && level.product && (
        <g transform={`translate(${state.goal.x},${state.goal.y})`}>
          <g>
            <animateTransform attributeName="transform" type="scale" dur={`${cycle}s`} repeatCount="indefinite"
              values="1;1;1.18;1;1" keyTimes={`0;${r(state.goal.delay)};${r(state.goal.delay + 0.25)};${r(state.goal.delay + 0.5)};1`} />
            <image className="flow-product" href={`${TILE}product-${level.product.icon}.svg`} width={size * 2.4} height={size * 2.4} x={-size * 1.2} y={-size * 1.2}
              style={{ animationDelay: `${state.goal.delay}s` }} />
          </g>
        </g>
      )}
    </svg>
  );
}
