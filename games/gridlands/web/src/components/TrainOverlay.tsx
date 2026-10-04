import { useEffect, useState } from 'react';
import type { Level } from '../core/engine';

const SPEED = 3.2; // 每秒走过的格数

/** 通关后，一列火车沿铁轨从第一座车站开到第二座车站，循环播放 */
export function TrainOverlay({ level, assignment, boardRef }: { level: Level; assignment: Record<number, string>; boardRef: React.RefObject<HTMLDivElement> }) {
  const [state, setState] = useState<{ w: number; h: number; path: string; steps: number; cell: number } | null>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const stations = level.regions.filter((r) => r.kind === 'station');
    if (stations.length < 2) return;
    const rails = new Set(level.regions.filter((r) => r.kind === 'rail').map((r) => r.id));
    const [from, to] = stations;
    const byXY = new Map(level.board.cells.map((c) => [`${c.x},${c.y}`, c]));
    const near = (c: { x: number; y: number }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => byXY.get(`${c.x + dx},${c.y + dy}`)).filter(Boolean) as typeof level.board.cells;
    const owned = (rid: string) => level.board.cells.filter((c) => assignment[c.id] === rid);

    // 从起点站出发，只走铁轨格子，找到一条通往终点站的最短路
    const prev = new Map<number, number | null>();
    const queue: number[] = [];
    for (const c of owned(from.id)) for (const n of near(c)) if (rails.has(assignment[n.id]) && !prev.has(n.id)) { prev.set(n.id, null); queue.push(n.id); }
    let end: number | null = null;
    const byId = new Map(level.board.cells.map((c) => [c.id, c]));
    while (queue.length && end == null) {
      const id = queue.shift()!;
      for (const n of near(byId.get(id)!)) {
        if (assignment[n.id] === to.id) { end = id; break; }
        if (rails.has(assignment[n.id]) && !prev.has(n.id)) { prev.set(n.id, id); queue.push(n.id); }
      }
    }
    if (end == null) return;
    const route: number[] = [];
    for (let id: number | null = end; id != null; id = prev.get(id) ?? null) route.unshift(id);

    const base = board.getBoundingClientRect();
    const center = (id: number) => {
      const r = board.querySelector(`.cell[data-id="${id}"]`)!.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, s: r.width };
    };
    const mid = (rid: string) => { const ps = owned(rid).map((c) => center(c.id)); return { x: ps.reduce((m, p) => m + p.x, 0) / ps.length, y: ps.reduce((m, p) => m + p.y, 0) / ps.length }; };
    const pts = [mid(from.id), ...route.map(center), mid(to.id)];
    setState({
      w: base.width, h: base.height, steps: route.length + 2, cell: center(route[0]).s,
      path: pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    });
  }, [level, assignment, boardRef]);

  if (!state) return null;
  const run = state.steps / SPEED;
  const dur = run + 1.4;
  const end = (run / dur).toFixed(4);
  const L = state.cell * 0.78, W = state.cell * 0.42;
  return (
    <svg className="flow-overlay train-overlay" viewBox={`0 0 ${state.w} ${state.h}`} aria-hidden="true">
      <g>
        <animateMotion path={state.path} dur={`${dur}s`} repeatCount="indefinite" rotate="auto" calcMode="linear" keyPoints="0;1;1" keyTimes={`0;${end};1`} />
        <animate attributeName="opacity" dur={`${dur}s`} repeatCount="indefinite" values="0;1;1;0;0" keyTimes={`0;0.04;${end};${Math.min(0.99, run / dur + 0.12).toFixed(4)};1`} />
        <rect x={-L / 2} y={-W / 2} width={L} height={W} rx={W * 0.35} fill="#c62828" stroke="#4e1414" strokeWidth={1.5} />
        <rect x={-L / 2 + 2} y={-W / 2 + 2} width={L * 0.32} height={W - 4} rx={W * 0.2} fill="#37474f" />
        <circle cx={L * 0.14} cy={0} r={W * 0.17} fill="#263238" />
        <circle cx={L / 2 - W * 0.12} cy={0} r={W * 0.12} fill="#ffeb3b" />
      </g>
    </svg>
  );
}
