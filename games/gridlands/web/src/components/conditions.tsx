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
  return t(locale, c.type, params);
}

// 一条条件行（✓/✗ + 文字）
export function CondRow({ level, locale, c }: { level: Level; locale: Locale; c: ConstraintResult }) {
  return (
    <li className={c.satisfied ? 'cond ok' : 'cond bad'}>
      <span className="tick">{c.satisfied ? '✓' : '✗'}</span>
      <span>{describeConstraint(level, locale, c)}</span>
    </li>
  );
}
