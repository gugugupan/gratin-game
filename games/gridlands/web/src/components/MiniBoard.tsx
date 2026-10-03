import type { Level } from '../core/engine';
import { TERRAIN_STYLE, TerrainIcon } from './icons';
import { at, seaCoords } from './sea';

export function MiniBoard({ level }: { level: Level }) {
  const { width, height } = level.board;
  const ordered = [...level.board.cells].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  return (
    <div className="mini-board" style={{ ['--cols' as any]: width, ['--rows' as any]: height, aspectRatio: `${width} / ${height}` }}>
      {seaCoords(level).map(([x, y]) => <div key={`sea-${x}-${y}`} className="mini-sea" style={at(x, y)} />)}
      {ordered.map((c) => {
        const tag = (c.tags || []).find((tg) => tg !== 'plain') ?? null;
        const blocked = c.assignable === false;
        return (
          <div key={c.id} className={'mini-cell' + (blocked ? ' blocked' : '')} style={{ ...at(c.x, c.y), background: (TERRAIN_STYLE[tag ?? 'plain'] ?? TERRAIN_STYLE.plain).bg }}>
            {tag ? <TerrainIcon tag={tag} /> : null}
          </div>
        );
      })}
    </div>
  );
}
