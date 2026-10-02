import type { Cell as CellT } from '../core/engine';
import { TERRAIN_STYLE, TerrainIcon } from './icons';

export interface CellView {
  cell: CellT;
  tag: string | null;     // 主地形/资源 tag（null=平原）
  bg: string;
  fillColor?: string;     // 已归属区域的填充色
  blocked: boolean;
  highlight?: 'pos' | 'neg';
  preview: boolean;
  conflict: boolean;
}

export function Cell({ cell, tag, bg, fillColor, blocked, highlight, preview, conflict }: CellView) {
  const cls = ['cell'];
  if (blocked) cls.push('blocked');
  if (highlight) cls.push(highlight === 'pos' ? 'hl-pos' : 'hl-neg');
  if (preview) cls.push('preview');
  if (conflict) cls.push('conflict');

  const style: React.CSSProperties = { background: fillColor ?? bg };
  // 图标色：障碍/已归属区域用白色，否则用地形主色
  const glyphColor = blocked || fillColor
    ? 'rgba(255,255,255,0.9)'
    : (tag ? TERRAIN_STYLE[tag]?.fg : '') || '';
  return (
    <div className={cls.join(' ')} style={style} data-id={cell.id}>
      {tag ? <TerrainIcon tag={tag} color={glyphColor} /> : null}
    </div>
  );
}
