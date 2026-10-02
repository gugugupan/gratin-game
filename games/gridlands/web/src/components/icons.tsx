// 扁平极简 SVG 图标集（呼应分割方格 logo）。无外部图片，矢量、可动态上色。

// ── 地形/资源：每类一套 浅底 bg + 主色 fg + 图形 ──
export const TERRAIN_STYLE: Record<string, { bg: string; fg: string }> = {
  plain: { bg: '#edf4e8', fg: '#9ccc8f' },
  forest: { bg: '#d8ecd2', fg: '#2e7d32' },
  lake: { bg: '#d4ecf8', fg: '#0288d1' },
  mountain: { bg: '#e8e1d8', fg: '#6d4c41' },
  gold: { bg: '#fff3cf', fg: '#f9a825' },
  iron: { bg: '#e4e8ea', fg: '#607d8b' },
  farmland: { bg: '#f4ecd4', fg: '#b07d22' },
  building: { bg: '#e6e9ee', fg: '#566b7b' },
};

function terrainGlyph(tag: string) {
  switch (tag) {
    case 'forest':
      return <path d="M12 3 L18 13 H14 L19 20 H5 L10 13 H6 Z" />;
    case 'mountain':
      return <path d="M3 20 L9 7 L13 14 L16 9 L21 20 Z" />;
    case 'lake':
      return <path d="M12 3 C 16 9 19 12 19 15 a7 7 0 0 1 -14 0 C5 12 8 9 12 3 Z" />;
    case 'gold':
      return <path d="M12 3 L20 11 L12 21 L4 11 Z" />;
    case 'iron':
      return <path d="M5 9 L11 4 L18 7 L20 14 L14 20 L6 17 Z" />;
    case 'farmland': // 耕地：犁过的田垄
      return <><rect x="4" y="7" width="16" height="2.6" rx="1.3" /><rect x="4" y="11" width="16" height="2.6" rx="1.3" /><rect x="4" y="15" width="16" height="2.6" rx="1.3" /></>;
    case 'building': // 建筑：两栋楼
      return <><rect x="4.5" y="9" width="6" height="11" rx="0.8" /><rect x="12" y="5" width="7" height="15" rx="0.8" /></>;
    default:
      return null; // plain 无图形
  }
}

export function TerrainIcon({ tag, color }: { tag: string; color: string }) {
  const g = terrainGlyph(tag);
  if (!g) return null;
  return (
    <svg className="terrain" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      {g}
    </svg>
  );
}

// ── 角色头像：圆角方块底（owner.color）+ 白色职业图形 ──
function roleGlyph(icon?: string) {
  switch (icon) {
    case 'farmer': // 草帽
      return <><ellipse cx="12" cy="15.5" rx="9" ry="2.6" /><path d="M6.5 15 Q12 4 17.5 15 Z" /></>;
    case 'rancher': // 马蹄铁
      return <path d="M7.5 19 V12 a4.5 4.5 0 0 1 9 0 V19" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />;
    case 'miner': // 安全帽 + 头灯
      return <><path d="M5 16 a7 7 0 0 1 14 0 Z" /><circle cx="12" cy="7.5" r="2.1" /><rect x="3.5" y="16" width="17" height="2.4" rx="1.2" /></>;
    case 'forester': // 松树
      return <path d="M12 4 L17 12 H14 L18 18 H6 L10 12 H7 Z" />;
    case 'developer': // 楼宇
      return <><rect x="6.5" y="5" width="11" height="14" rx="1" /><g fill="#0009"><rect x="8.5" y="7.5" width="2.2" height="2.2" /><rect x="13.3" y="7.5" width="2.2" height="2.2" /><rect x="8.5" y="11.5" width="2.2" height="2.2" /><rect x="13.3" y="11.5" width="2.2" height="2.2" /></g></>;
    case 'crown': // 皇冠
      return <path d="M4 9 L8 13 L12 6 L16 13 L20 9 L20 18 L4 18 Z" />;
    case 'house': // 房子
      return <><path d="M3.5 11.5 L12 4 L20.5 11.5 Z" /><rect x="6" y="11" width="12" height="8" rx="0.8" /></>;
    default: // 通用剪影
      return <><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20 a7.5 7.5 0 0 1 15 0 Z" /></>;
  }
}

export function RoleAvatar({ icon, color, size = 24 }: { icon?: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="avatar" aria-hidden="true">
      <rect x="0" y="0" width="24" height="24" rx="6" fill={color} />
      <g fill="#fff">{roleGlyph(icon)}</g>
    </svg>
  );
}
