import { useGame, useValidation } from '../state/store';
import { t } from '../i18n';
import { CondRow } from './conditions';

// 全局条件（不属于任何单个区域）；区域自身的条件已并入 RegionList 的按钮内
export function ConditionPanel() {
  const level = useGame((s) => s.level);
  const locale = useGame((s) => s.locale);
  const validation = useValidation();
  if (!validation) return null;

  const globals = validation.constraints.filter((c) => c.scope === 'global');
  if (!globals.length) return null;

  return (
    <div className="condition-panel">
      <div className="cond-group">
        <div className="cond-head">{t(locale, 'globalConditions')}</div>
        <ul>{globals.map((c, i) => <CondRow key={i} level={level} locale={locale} c={c} />)}</ul>
      </div>
    </div>
  );
}
