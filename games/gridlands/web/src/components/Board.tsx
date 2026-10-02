import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, useValidation } from '../state/store';
import { Cell } from './Cell';
import { TERRAIN_STYLE } from './icons';

interface Drag { ax: number; ay: number; cx: number; cy: number; }
interface Stamp { ids: Set<number>; ax: number; ay: number; odd: boolean; }

export function Board() {
  const level = useGame((s) => s.level);
  const assignment = useGame((s) => s.assignment);
  const selectedRegion = useGame((s) => s.selectedRegion);
  const assignCells = useGame((s) => s.assignCells);
  const validation = useValidation();
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const won = validation?.ok ?? false;

  const { width, height } = level.board;

  // 按行主序排好的格子
  const ordered = useMemo(
    () => [...level.board.cells].sort((a, b) => (a.y - b.y) || (a.x - b.x)),
    [level],
  );

  const ownerColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of level.regions) m.set(r.id, r.owner.color);
    return m;
  }, [level]);

  // 选中区域 → 相关格高亮（含/不含 cell、含/不含/接触 tag）
  const highlight = useMemo(() => {
    const m = new Map<number, 'pos' | 'neg'>();
    const region = level.regions.find((r) => r.id === selectedRegion);
    if (!region) return m;
    const tagCells = (tag: string) => level.board.cells.filter((c) => (c.tags || []).includes(tag));
    for (const c of region.constraints || []) {
      const p = c.params || {};
      if (c.type === 'MUST_CONTAIN_CELL') m.set(p.cellId, 'pos');
      else if (c.type === 'MUST_NOT_CONTAIN_CELL') m.set(p.cellId, 'neg');
      else if (c.type === 'MUST_CONTAIN_TAG' || c.type === 'MUST_TOUCH_TAG')
        tagCells(p.tag).forEach((cc) => m.set(cc.id, m.get(cc.id) ?? 'pos'));
      else if (c.type === 'MUST_NOT_CONTAIN_TAG' || c.type === 'MUST_NOT_TOUCH_TAG')
        tagCells(p.tag).forEach((cc) => m.set(cc.id, 'neg'));
    }
    return m;
  }, [level, selectedRegion]);

  // 矩形硬规则不满足的区域 → 其格子标红
  const conflictCells = useMemo(() => {
    const set = new Set<number>();
    if (!validation) return set;
    const bad = new Set(validation.hard.filter((h) => !h.ok).map((h) => h.regionId));
    for (const [cid, rid] of Object.entries(assignment)) if (bad.has(rid)) set.add(Number(cid));
    return set;
  }, [validation, assignment]);

  const previewSet = useMemo(() => {
    const s = new Set<number>();
    if (!drag) return s;
    const minX = Math.min(drag.ax, drag.cx), maxX = Math.max(drag.ax, drag.cx);
    const minY = Math.min(drag.ay, drag.cy), maxY = Math.max(drag.ay, drag.cy);
    for (const c of level.board.cells)
      if (c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY && c.assignable !== false) s.add(c.id);
    return s;
  }, [drag, level]);

  function cellAt(clientX: number, clientY: number) {
    // 用命中测试取格子，兼容棋盘的内边距/间隙（「阡陌」缝隙）
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cellEl = el?.closest('.cell') as HTMLElement | null;
    if (!cellEl || !boardRef.current?.contains(cellEl)) return null;
    const id = Number(cellEl.dataset.id);
    const c = level.board.cells.find((cc) => cc.id === id);
    return c ? { x: c.x, y: c.y } : null;
  }

  function onPointerDown(e: React.PointerEvent) {
    const p = cellAt(e.clientX, e.clientY);
    if (!p) return;
    try { boardRef.current?.setPointerCapture(e.pointerId); } catch { /* 合成事件/无活动指针时忽略 */ }
    setDrag({ ax: p.x, ay: p.y, cx: p.x, cy: p.y });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = cellAt(e.clientX, e.clientY);
    if (p) setDrag((d) => (d ? { ...d, cx: p.x, cy: p.y } : d));
  }
  function commit() {
    if (drag) {
      assignCells([...previewSet]);
      if (selectedRegion && previewSet.size) {
        setStamp((s) => ({ ids: new Set(previewSet), ax: drag.ax, ay: drag.ay, odd: !s?.odd }));
      }
    }
    setDrag(null);
  }

  useEffect(() => {
    const up = () => commit();
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, previewSet]);

  return (
    <div
      ref={boardRef}
      className="board"
      style={{ ['--cols' as any]: width, ['--rows' as any]: height, aspectRatio: `${width} / ${height}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {ordered.map((c) => {
        const rid = assignment[c.id];
        const mainTag = (c.tags || []).find((tg) => tg !== 'plain') ?? null;
        const style = TERRAIN_STYLE[mainTag ?? 'plain'] ?? TERRAIN_STYLE.plain;
        return (
          <Cell
            key={c.id}
            cell={c}
            tag={mainTag}
            bg={style.bg}
            fillColor={rid ? ownerColor.get(rid) : undefined}
            blocked={c.assignable === false}
            highlight={highlight.get(c.id)}
            preview={previewSet.has(c.id)}
            conflict={conflictCells.has(c.id)}
            stamp={stamp?.ids.has(c.id) ? { odd: stamp.odd, delay: (Math.abs(c.x - stamp.ax) + Math.abs(c.y - stamp.ay)) * 35 } : undefined}
            celebrateDelay={won ? 250 + (c.x + c.y) * 70 : undefined}
          />
        );
      })}
    </div>
  );
}
