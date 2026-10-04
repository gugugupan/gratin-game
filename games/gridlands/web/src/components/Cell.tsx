import type { Cell as CellT } from '../core/engine';
import { TerrainIcon } from './icons';
import { at } from './sea';

export interface CellView {
  cell: CellT;
  tag: string | null;     // 主地形/资源 tag（null=平原）
  bg: string;
  fillColor?: string;     // 已归属区域的填充色
  blocked: boolean;
  highlight?: 'pos' | 'neg' | 'zone' | 'reach';
  preview: boolean;
  conflict: boolean;
  fixed?: boolean;
  rail?: 'h' | 'v' | 'x';
  station?: boolean;
  stamp?: { odd: boolean; delay: number };
  celebrateDelay?: number;
}

const GRASS_BASE = `${import.meta.env.BASE_URL}tiles/grass-`;
const FLAG = `${import.meta.env.BASE_URL}tiles/flag.svg`;

export function Cell({ cell, tag, bg, fillColor, blocked, highlight, preview, conflict, fixed, rail, station, stamp, celebrateDelay }: CellView) {
  const cls = ['cell'];
  if (blocked) cls.push('blocked');
  if (highlight) cls.push(`hl-${highlight}`);
  if (preview) cls.push('preview');
  if (conflict) cls.push('conflict');
  if (fillColor) cls.push('assigned');
  if (rail) cls.push(`rail rail-${rail}`);
  if (station) cls.push('station');
  if (stamp) cls.push(stamp.odd ? 'stamp-b' : 'stamp-a');
  if (celebrateDelay !== undefined) cls.push('celebrate');

  const style = { ...at(cell.x, cell.y), ...(fillColor ? { ['--region' as any]: fillColor } : { backgroundColor: bg }) } as React.CSSProperties;
  if (!tag && !blocked) style.backgroundImage = `url(${GRASS_BASE}${((cell.x * 7 + cell.y * 3) % 3) + 1}.svg)`;
  if (stamp) style.animationDelay = `${stamp.delay}ms`;
  if (celebrateDelay !== undefined) (style as any)['--celebrate-delay'] = `${celebrateDelay}ms`;
  return (
    <div className={cls.join(' ')} style={style} data-id={cell.id}>
      {rail ? <span className="track" aria-hidden="true" /> : null}
      {tag ? <TerrainIcon tag={tag} /> : null}
      {fixed ? <img className="flag" src={FLAG} alt="" draggable={false} /> : null}
    </div>
  );
}
