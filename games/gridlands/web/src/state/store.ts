import { create } from 'zustand';
import type { Level, RegionsMap, ValidateResult } from '../core/engine';
import { validate } from '../core/engine.js';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n';

type Assignment = Record<number, string>; // cellId -> regionId

const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v);

// 没选过语言时，先沿用グラタンゲーム首页的语言，再看浏览器语言
const initialLocale: Locale = (() => {
  try {
    for (const key of ['rlp-locale', 'gratin-game:locale']) {
      const saved = localStorage.getItem(key);
      if (isLocale(saved)) return saved;
    }
  } catch { /* ignore */ }
  const browser = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase().split('-')[0]).find(isLocale);
  return browser ?? DEFAULT_LOCALE;
})();

const setDocumentLang = (locale: Locale) => {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
};
setDocumentLang(initialLocale);

// v1 的关卡编号是 1-1,1-2,2-1,2-2,3-1,4-1；v2 起它们统一为第 1 章 1-1…1-6，2-x 留给新关卡
// v3：每章补到 8 关，原来的尾声 2-7/3-7/4-7 改为 2-8/3-8/4-8
const PROGRESS_VERSION = '3';
const V1_TO_V2: Record<string, string> = { '1-1': '1-1', '1-2': '1-2', '2-1': '1-3', '2-2': '1-4', '3-1': '1-5', '4-1': '1-6' };
const V2_TO_V3: Record<string, string> = { '2-7': '2-8', '3-7': '3-8', '4-7': '4-8' };

const initialPassed: string[] = (() => {
  try {
    const saved: string[] = JSON.parse(localStorage.getItem('rlp-progress') || '[]');
    const version = localStorage.getItem('rlp-progress-version');
    if (version === PROGRESS_VERSION) return saved;
    const v2 = version ? saved : saved.map((id) => V1_TO_V2[id]).filter(Boolean);
    const migrated = [...new Set(v2.map((id) => V2_TO_V3[id] ?? id))];
    localStorage.setItem('rlp-progress', JSON.stringify(migrated));
    localStorage.setItem('rlp-progress-version', PROGRESS_VERSION);
    return migrated;
  } catch { return []; }
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
    setDocumentLang(locale);
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
