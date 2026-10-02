// ── 地形/资源：每类一个浅色格底 ──
export const TERRAIN_STYLE: Record<string, { bg: string }> = {
  plain: { bg: '#edf4e8' },
  forest: { bg: '#d8ecd2' },
  lake: { bg: '#d4ecf8' },
  mountain: { bg: '#e8e1d8' },
  gold: { bg: '#fff3cf' },
  iron: { bg: '#e4e8ea' },
  farmland: { bg: '#f4ecd4' },
  building: { bg: '#e6e9ee' },
};

// 地形/资源与角色图像：Microsoft Fluent Emoji（Flat 风格，MIT），见 public/tiles/LICENSE.txt
const TILE_BASE = `${import.meta.env.BASE_URL}tiles/`;
const TERRAIN_IMAGES = new Set(['forest', 'mountain', 'lake', 'gold', 'iron', 'farmland', 'building']);
const ROLE_IMAGES = new Set(['farmer', 'rancher', 'miner', 'forester', 'developer', 'crown', 'house', 'fisher']);

export function TerrainIcon({ tag }: { tag: string }) {
  if (!TERRAIN_IMAGES.has(tag)) return null; // plain 无图形
  return <img className="terrain" src={`${TILE_BASE}terrain-${tag}.svg`} alt="" draggable={false} />;
}

// ── 角色头像：浅色区域底 + 区域色描边 + 职业图像 ──
export function RoleAvatar({ icon, color, size = 24 }: { icon?: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, ['--region' as any]: color }} aria-hidden="true">
      {icon && ROLE_IMAGES.has(icon) ? (
        <img src={`${TILE_BASE}role-${icon}.svg`} alt="" draggable={false} />
      ) : (
        <svg viewBox="0 0 24 24" fill={color}><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20 a7.5 7.5 0 0 1 15 0 Z" /></svg>
      )}
    </span>
  );
}
