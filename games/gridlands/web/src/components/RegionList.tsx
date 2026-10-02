import { useGame, buildRegionsMap, useValidation } from '../state/store';
import { localized, t } from '../i18n';
import { CondRow } from './conditions';
import { RoleAvatar } from './icons';

export function RegionList() {
  const level = useGame((s) => s.level);
  const locale = useGame((s) => s.locale);
  const assignment = useGame((s) => s.assignment);
  const selectedRegion = useGame((s) => s.selectedRegion);
  const selectRegion = useGame((s) => s.selectRegion);
  const clearRegion = useGame((s) => s.clearRegion);
  const validation = useValidation();
  const regionsMap = buildRegionsMap(level, assignment);

  return (
    <div className="region-list">
      {level.regions.map((r) => {
        const count = regionsMap.get(r.id)?.length ?? 0;
        const active = r.id === selectedRegion;
        const conds = validation
          ? validation.constraints.filter((c) => c.scope === 'region' && c.regionId === r.id)
          : [];
        return (
          <div
            key={r.id}
            className={'region-item' + (active ? ' active' : '') + (validation?.ok ? ' celebrate' : '')}
            onClick={() => selectRegion(r.id)}
          >
            <div className="region-head">
              <RoleAvatar icon={r.owner.icon} color={r.owner.color} size={26} />
              <span className="region-name">{localized(r.owner.name, locale)}</span>
              <span className="region-area">{t(locale, 'cells', { n: count })}</span>
              <button
                className="clear-btn"
                title={t(locale, 'clear')}
                onClick={(e) => { e.stopPropagation(); clearRegion(r.id); }}
              >{t(locale, 'clear')}</button>
            </div>
            {conds.length > 0 && (
              <ul className="region-conds">
                {conds.map((c, i) => <CondRow key={i} level={level} locale={locale} c={c} />)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
