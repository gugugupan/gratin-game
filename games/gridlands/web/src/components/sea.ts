import type { Level } from '../core/engine';

/** 地图上不存在的格子（海）：不规则地图用它们画出海岸线 */
export function seaCoords(level: Level): Array<[number, number]> {
  const { width, height, cells } = level.board;
  const has = new Set(cells.map((c) => `${c.x},${c.y}`));
  const out: Array<[number, number]> = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (!has.has(`${x},${y}`)) out.push([x, y]);
  return out;
}

export const at = (x: number, y: number) => ({ gridColumn: x + 1, gridRow: y + 1 });
