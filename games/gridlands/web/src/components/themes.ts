// 每关的氛围：页面底色渐变 + 棋盘边框色 + 故事卡片插图（public/tiles/theme-<key>.svg）
export interface Theme { bg: string; bg2: string; frame: string }

export const THEMES: Record<string, Theme> = {
  meadow: { bg: '#f3f1ea', bg2: '#e9ede2', frame: '#b8b09c' },
  town: { bg: '#f5f0e8', bg2: '#ece3d6', frame: '#c2a98a' },
  quarry: { bg: '#f2f1ee', bg2: '#e3e6e9', frame: '#a7adb3' },
  forest: { bg: '#eef3ea', bg2: '#dce9d6', frame: '#8fae86' },
  mountain: { bg: '#f3efea', bg2: '#e6ddd2', frame: '#a8957f' },
  royal: { bg: '#f7f2e4', bg2: '#efe2c4', frame: '#c9a85a' },
  river: { bg: '#eef3f6', bg2: '#d9e7ef', frame: '#8fb3c7' },
  mine: { bg: '#f4eee6', bg2: '#e4d6c4', frame: '#a98a66' },
};

export const DEFAULT_THEME = 'meadow';

export function themeVars(key?: string): React.CSSProperties {
  const th = THEMES[key ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME];
  return { ['--bg' as any]: th.bg, ['--bg2' as any]: th.bg2, ['--frame' as any]: th.frame };
}

export function themeIcon(key?: string): string {
  return `${import.meta.env.BASE_URL}tiles/theme-${THEMES[key ?? ''] ? key : DEFAULT_THEME}.svg`;
}
