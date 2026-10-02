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
}

export function Cell({ cell, tag, bg, fillColor, blocked, highlight, preview, conflict }: CellView) {
  const cls = ['cell'];
  if (blocked) cls.push('blocked');
  if (highlight) cls.push(highlight === 'pos' ? 'hl-pos' : 'hl-neg');
  if (preview) cls.push('preview');
  if (conflict) cls.push('conflict');
  if (fillColor) cls.push('assigned');

  const style = (fillColor ? { ['--region' as any]: fillColor } : { background: bg }) as React.CSSProperties;
  return (
    <div className={cls.join(' ')} style={style} data-id={cell.id}>
      {tag ? <TerrainIcon tag={tag} /> : null}
    </div>
  );
}
