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
  contract: { bg: '#f7f3ea', bg2: '#ece2cc', frame: '#b9a27a' },
  wishlist: { bg: '#f6f3e4', bg2: '#e9e1bf', frame: '#b5a35c' },
  debate: { bg: '#f2f1f5', bg2: '#e0dde9', frame: '#9c93b5' },
  blueprint: { bg: '#eef2f8', bg2: '#d9e2ef', frame: '#7f97b8' },
  epilogue: { bg: '#f7f1ec', bg2: '#f0dfd2', frame: '#c99a7c' },
  landing: { bg: '#eef5f7', bg2: '#d8ebf0', frame: '#7fb0bf' },
  island: { bg: '#f6f3e6', bg2: '#e0eee4', frame: '#94b98f' },
  compass: { bg: '#f3f2ec', bg2: '#e0e6ed', frame: '#8e9fb2' },
  wind: { bg: '#eff3f5', bg2: '#dbe4ea', frame: '#8fa5b3' },
  tide: { bg: '#ecf4f8', bg2: '#d0e4ef', frame: '#6fa3bf' },
  harbor: { bg: '#f1f2f4', bg2: '#dbe2ea', frame: '#8597ab' },
  bonfire: { bg: '#f8efe6', bg2: '#f0d7bf', frame: '#c98d5a' },
};

export const DEFAULT_THEME = 'meadow';

export function themeVars(key?: string): React.CSSProperties {
  const th = THEMES[key ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME];
  return { ['--bg' as any]: th.bg, ['--bg2' as any]: th.bg2, ['--frame' as any]: th.frame };
}

export function themeIcon(key?: string): string {
  return `${import.meta.env.BASE_URL}tiles/theme-${THEMES[key ?? ''] ? key : DEFAULT_THEME}.svg`;
}
