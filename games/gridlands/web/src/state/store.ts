import { create } from 'zustand';
import type { Level, RegionsMap, ValidateResult } from '../core/engine';
import { validate } from '../core/engine.js';
import { DEFAULT_LOCALE, type Locale } from '../i18n';

type Assignment = Record<number, string>; // cellId -> regionId

const initialLocale: Locale = (() => {
  try { return (localStorage.getItem('rlp-locale') as Locale) || DEFAULT_LOCALE; } catch { return DEFAULT_LOCALE; }
})();

const initialPassed: string[] = (() => {
  try { return JSON.parse(localStorage.getItem('rlp-progress') || '[]'); } catch { return []; }
})();

interface GameState {
  level: Level;
  assignment: Assignment;
  selectedRegion: string | null;
  history: Assignment[];
  locale: Locale;
  passed: string[];

  loadLevel: (level: Level) => void;
  markPassed: (id: string) => void;
  selectRegion: (regionId: string) => void;
  assignCells: (cellIds: number[]) => void; // 把这些格分配给当前选中区域
  clearRegion: (regionId: string) => void;
  undo: () => void;
  reset: () => void;
  setLocale: (locale: Locale) => void;
}

const blockedSet = (level: Level) =>
  new Set(level.board.cells.filter((c) => c.assignable === false).map((c) => c.id));

function freshAssignment(level: Level): Assignment {
  // 应用 fixedRegion 预置线索
  const a: Assignment = {};
  for (const c of level.board.cells) if (c.fixedRegion) a[c.id] = c.fixedRegion;
  return a;
}

export const useGame = create<GameState>((set, get) => ({
  level: undefined as unknown as Level,
  assignment: {},
  selectedRegion: null,
  history: [],
  locale: initialLocale,
  passed: initialPassed,

  loadLevel: (level) =>
    set({ level, assignment: freshAssignment(level), selectedRegion: level.regions[0]?.id ?? null, history: [] }),

  markPassed: (id) => {
    const { passed } = get();
    if (passed.includes(id)) return;
    const next = [...passed, id];
    try { localStorage.setItem('rlp-progress', JSON.stringify(next)); } catch { /* ignore */ }
    set({ passed: next });
  },

  selectRegion: (regionId) => set({ selectedRegion: regionId }),

  assignCells: (cellIds) => {
    const { level, assignment, selectedRegion, history } = get();
    if (!selectedRegion || !cellIds.length) return;
    const blocked = blockedSet(level);
    const next = { ...assignment };
    // 每个区域必为一个矩形：新拖拽先清空该区域旧的选择（保留预置线索），再赋上新矩形
    for (const [cid, rid] of Object.entries(next)) {
      if (rid !== selectedRegion) continue;
      const cell = level.board.cells.find((c) => c.id === Number(cid));
      if (!cell?.fixedRegion) delete next[Number(cid)];
    }
    for (const id of cellIds) {
      if (blocked.has(id)) continue; // 障碍格不可分配
      const cell = level.board.cells.find((c) => c.id === id);
      if (cell?.fixedRegion && cell.fixedRegion !== selectedRegion) continue; // 其他区域的锁定格不可夺取
      next[id] = selectedRegion;
    }
    set({ assignment: next, history: [...history, assignment] });
  },

  clearRegion: (regionId) => {
    const { level, assignment, history } = get();
    const next: Assignment = {};
    for (const [cid, rid] of Object.entries(assignment)) {
      const id = Number(cid);
      const cell = level.board.cells.find((c) => c.id === id);
      // 保留预置线索；清掉该区域其余格子
      if (rid === regionId && !cell?.fixedRegion) continue;
      next[id] = rid;
    }
    set({ assignment: next, history: [...history, assignment] });
  },

  undo: () => {
    const { history } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({ assignment: prev, history: history.slice(0, -1) });
  },

  reset: () => {
    const { level, assignment, history } = get();
    set({ assignment: freshAssignment(level), history: [...history, assignment] });
  },

  setLocale: (locale) => {
    try { localStorage.setItem('rlp-locale', locale); } catch { /* ignore */ }
    set({ locale });
  },
}));

export function buildRegionsMap(level: Level, assignment: Assignment): RegionsMap {
  const m: RegionsMap = new Map(level.regions.map((r) => [r.id, [] as number[]]));
  for (const [cid, rid] of Object.entries(assignment)) m.get(rid)?.push(Number(cid));
  return m;
}

export function useValidation(): ValidateResult | null {
  const level = useGame((s) => s.level);
  const assignment = useGame((s) => s.assignment);
  if (!level) return null;
  return validate(level, buildRegionsMap(level, assignment));
}
