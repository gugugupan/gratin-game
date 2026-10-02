import type { Level } from './core/engine';

// 编译期把上级 levels/ 目录的所有关卡 JSON 打包进来（MVP：硬编码关卡）
const mods = import.meta.glob('../../levels/*.json', { eager: true, import: 'default' }) as Record<string, Level>;

export const LEVELS: Level[] = Object.values(mods).sort((a, b) => (a.id < b.id ? -1 : 1));

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

// 顺序解锁：第 1 关默认解锁；其余需上一关已通关
export function isUnlocked(id: string, passed: string[]): boolean {
  const i = levelIndex(id);
  if (i <= 0) return true;
  return passed.includes(LEVELS[i - 1].id);
}

export function nextLevel(id: string): Level | undefined {
  const i = levelIndex(id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : undefined;
}
