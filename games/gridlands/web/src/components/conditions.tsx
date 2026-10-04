import type { ConstraintResult, Level } from '../core/engine';
import { localized, t, tagName, type Locale } from '../i18n';
import { RoleAvatar } from './icons';

// 把一条条件求值结果渲染成本地化文字
export function describeConstraint(level: Level, locale: Locale, c: ConstraintResult): string {
  const p = c.params || {};
  const rname = (id: string) => {
    const r = level.regions.find((x) => x.id === id);
    return r ? localized(r.owner.name, locale) : id;
  };
  const params: Record<string, string | number> = {};
  if (p.value != null) params.value = p.value;
  if (p.cellId != null) params.cellId = p.cellId;
  if (p.tag != null) params.tag = tagName(p.tag, locale);
  if (p.region != null) params.region = rname(p.region);
  if (p.a != null) params.a = rname(p.a);
  if (p.b != null) params.b = rname(p.b);
  if (p.dir != null) params.dir = t(locale, 'dir_' + p.dir);
  if (p.dist != null) params.dist = p.dist;
  const key = c.type === 'SUPPLIED_BY' && (p.tag == null || p.value == null) ? 'SUPPLIED_BY_ANY' : c.type;
  return t(locale, key, params);
}

const TILE = `${import.meta.env.BASE_URL}tiles/`;
// 用不可见字符占位，渲染时换成「图标 + 名字」的小标签
const MARKS = { tag: '\u0001', region: '\u0002', a: '\u0003', b: '\u0004' } as const;

// 同 describeConstraint，但资源名前带地形图标、区域名前带头像和区域色，方便和棋盘对照
function describeWithIcons(level: Level, locale: Locale, c: ConstraintResult): React.ReactNode {
  const p = c.params || {};
  const marked: Record<string, string> = {};
  for (const k of Object.keys(MARKS) as Array<keyof typeof MARKS>) if (p[k] != null) marked[k] = MARKS[k];
  if (!Object.keys(marked).length) return describeConstraint(level, locale, c);
  const text = describeConstraint(level, locale, { ...c, params: { ...p, ...marked } });
  const chip = (mark: string, key: number) => {
    if (mark === MARKS.tag) {
      return (
        <span key={key} className="tag-chip">
          <img src={`${TILE}terrain-${p.tag}.svg`} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {tagName(p.tag, locale)}
        </span>
      );
    }
    const id = mark === MARKS.region ? p.region : mark === MARKS.a ? p.a : p.b;
    const r = level.regions.find((x) => x.id === id);
    if (!r) return id;
    return (
      <span key={key} className="region-chip" style={{ ['--region' as any]: r.owner.color }}>
        <RoleAvatar icon={r.owner.icon} color={r.owner.color} size={16} />
        {localized(r.owner.name, locale)}
      </span>
    );
  };
  return text.split(/([\u0001-\u0004])/).map((part, i) => (i % 2 ? chip(part, i) : part));
}

// 一条条件行（✓/✗ + 文字）
export function CondRow({ level, locale, c }: { level: Level; locale: Locale; c: ConstraintResult }) {
  return (
    <li className={c.satisfied ? 'cond ok' : 'cond bad'}>
      <span className="tick">{c.satisfied ? '✓' : '✗'}</span>
      <span>{describeWithIcons(level, locale, c)}</span>
    </li>
  );
}
