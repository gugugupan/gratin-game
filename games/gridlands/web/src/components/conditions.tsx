import type { ConstraintResult, Level } from '../core/engine';
import { localized, t, tagName, type Locale } from '../i18n';

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
const TAG_MARK = '\u0000';

// 同 describeConstraint，但资源名字前带上它的地形图标，方便和棋盘对照
function describeWithIcons(level: Level, locale: Locale, c: ConstraintResult): React.ReactNode {
  const tag = c.params?.tag as string | undefined;
  if (!tag) return describeConstraint(level, locale, c);
  const text = describeConstraint(level, locale, { ...c, params: { ...c.params, tag: TAG_MARK } }).replace(tagName(TAG_MARK, locale), TAG_MARK);
  const parts = text.split(TAG_MARK);
  return parts.flatMap((part, i) => i === 0 ? [part] : [
    <span key={i} className="tag-chip"><img src={`${TILE}terrain-${tag}.svg`} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />{tagName(tag, locale)}</span>,
    part,
  ]);
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
