import type { Cell as CellT } from '../core/engine';
import { TerrainIcon } from './icons';

export interface CellView {
  cell: CellT;
  tag: string | null;     // 主地形/资源 tag（null=平原）
  bg: string;
  fillColor?: string;     // 已归属区域的填充色
  blocked: boolean;
  highlight?: 'pos' | 'neg';
  preview: boolean;
  conflict: boolean;
  stamp?: { odd: boolean; delay: number };
  celebrateDelay?: number;
}

const GRASS_BASE = `${import.meta.env.BASE_URL}tiles/grass-`;

export function Cell({ cell, tag, bg, fillColor, blocked, highlight, preview, conflict, stamp, celebrateDelay }: CellView) {
  const cls = ['cell'];
  if (blocked) cls.push('blocked');
  if (highlight) cls.push(highlight === 'pos' ? 'hl-pos' : 'hl-neg');
  if (preview) cls.push('preview');
  if (conflict) cls.push('conflict');
  if (fillColor) cls.push('assigned');
  if (stamp) cls.push(stamp.odd ? 'stamp-b' : 'stamp-a');
  if (celebrateDelay !== undefined) cls.push('celebrate');

  const style = (fillColor ? { ['--region' as any]: fillColor } : { backgroundColor: bg }) as React.CSSProperties;
  if (!tag && !blocked) style.backgroundImage = `url(${GRASS_BASE}${((cell.x * 7 + cell.y * 3) % 3) + 1}.svg)`;
  if (stamp) style.animationDelay = `${stamp.delay}ms`;
  if (celebrateDelay !== undefined) (style as any)['--celebrate-delay'] = `${celebrateDelay}ms`;
  return (
    <div className={cls.join(' ')} style={style} data-id={cell.id}>
      {tag ? <TerrainIcon tag={tag} /> : null}
    </div>
  );
}
