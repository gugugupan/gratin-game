import type { Level } from './core/engine';

// 编译期把上级 levels/ 目录的所有关卡 JSON 打包进来（MVP：硬编码关卡）
const mods = import.meta.glob('../../levels/*.json', { eager: true, import: 'default' }) as Record<string, Level>;

const order = (id: string) => id.split('-').map(Number);
export const LEVELS: Level[] = Object.values(mods).sort((a, b) => {
  const [ca, na] = order(a.id), [cb, nb] = order(b.id);
  return ca - cb || na - nb;
});

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

// 网址带 ?unlock=all（放在 # 之前，或写在 #/levels?unlock=all 里）时全部关卡可玩；不改动通关记录
const QUERIES = [location.search, location.hash.split('?')[1] ?? ''].map((q) => new URLSearchParams(q));
export const UNLOCK_ALL = QUERIES.some((q) => q.get('unlock') === 'all');
// 网址带 ?answer=1：打开关卡时直接填好标准答案（也会解锁该关）；答案模式下不记录通关
export const SHOW_ANSWER = QUERIES.some((q) => ['1', 'true', 'yes'].includes(q.get('answer') ?? ''));

// 顺序解锁：第 1 关默认解锁；其余需上一关已通关
export function isUnlocked(id: string, passed: string[]): boolean {
  if (UNLOCK_ALL || SHOW_ANSWER) return true;
  const i = levelIndex(id);
  if (i <= 0) return true;
  return passed.includes(LEVELS[i - 1].id);
}

export function nextLevel(id: string): Level | undefined {
  const i = levelIndex(id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : undefined;
}
