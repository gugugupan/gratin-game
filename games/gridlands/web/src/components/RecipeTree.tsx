import { useLayoutEffect, useRef, useState } from 'react';
import { useGame, useValidation } from '../state/store';
import { localized, t, type Locale } from '../i18n';
import { RoleAvatar } from './icons';
import { recipeGraph } from './recipe';

const TILE = `${import.meta.env.BASE_URL}tiles/`;

interface Line { d: string; ok: boolean; color: string; lx: number; ly: number; tag?: string; value?: number }

export function RecipeTree() {
  const level = useGame((s) => s.level);
  const locale = useGame((s) => s.locale) as Locale;
  const selectRegion = useGame((s) => s.selectRegion);
  const selected = useGame((s) => s.selectedRegion);
  const validation = useValidation();
  const boxRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  const product = level.product;
  const { nodes, edges, depth } = recipeGraph(level);
  const cols = Math.max(0, ...nodes.map((n) => depth.get(n) ?? 0)) + 1;
  const won = validation?.ok ?? false;
  const edgeOk = (from: string, to: string) =>
    !!validation?.constraints.some((c) => c.type === 'SUPPLIED_BY' && c.regionId === to && c.params?.region === from && c.satisfied);
  const goalOk = !!product && won;
  const statusKey = edges.map((e) => (edgeOk(e.from, e.to) ? '1' : '0')).join('') + (goalOk ? 'W' : '');

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const base = box.getBoundingClientRect();
      const at = (id: string) => box.querySelector(`[data-node="${id}"]`)?.getBoundingClientRect();
      const out: Line[] = [];
      const link = (from: string, to: string, ok: boolean, color: string, tag?: string, value?: number) => {
        const a = at(from), b = at(to);
        if (!a || !b) return;
        const x1 = a.right - base.left, y1 = a.top + a.height / 2 - base.top;
        const x2 = b.left - base.left, y2 = b.top + b.height / 2 - base.top;
        const mx = (x1 + x2) / 2;
        out.push({ d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, ok, color, lx: x1 + 13, ly: y1, tag, value });
      };
      for (const e of edges) {
        const color = level.regions.find((r) => r.id === e.from)?.owner.color ?? '#999';
        link(e.from, e.to, edgeOk(e.from, e.to), color, e.tag, e.value);
      }
      if (product) link(product.goal, '__product', goalOk, '#c98d5a');
      setLines(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, statusKey]);

  if (!edges.length) return null;

  return (
    <div className="recipe">
      <div className="recipe-head">{t(locale, 'recipe')}</div>
      <div className="recipe-body" ref={boxRef} style={{ gridTemplateColumns: `repeat(${cols + (product ? 1 : 0)}, minmax(0, 1fr))` }}>
        <svg className="recipe-lines" aria-hidden="true">
          {lines.map((l, i) => (
            <g key={i} className={l.ok ? 'ok' : ''}>
              <path d={l.d} stroke={l.ok ? l.color : '#c9c2b4'} strokeDasharray={l.ok ? undefined : '4 4'} />
              {l.tag && (
                <g transform={`translate(${l.lx - 12},${l.ly - 10})`}>
                  <rect width="24" height="20" rx="10" fill="#fff" stroke={l.ok ? l.color : '#d6d1c4'} />
                  <image href={`${TILE}terrain-${l.tag}.svg`} x="2" y="3" width="14" height="14" />
                  <text x="17.5" y="14" textAnchor="middle">{l.value ?? ''}</text>
                </g>
              )}
            </g>
          ))}
        </svg>
        {Array.from({ length: cols }, (_, d) => (
          <div key={d} className="recipe-col">
            {nodes.filter((n) => (depth.get(n) ?? 0) === d).map((id) => {
              const r = level.regions.find((x) => x.id === id)!;
              return (
                <button key={id} type="button" data-node={id} className={'recipe-node' + (selected === id ? ' active' : '')} onClick={() => selectRegion(id)}>
                  <RoleAvatar icon={r.owner.icon} color={r.owner.color} size={28} />
                  <span>{localized(r.owner.name, locale)}</span>
                </button>
              );
            })}
          </div>
        ))}
        {product && (
          <div className="recipe-col">
            <div data-node="__product" className={'recipe-product' + (goalOk ? ' done' : '')} title={t(locale, 'product')}>
              <img src={`${TILE}product-${product.icon}.svg`} alt="" />
              <span>{localized(product.name, locale)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
