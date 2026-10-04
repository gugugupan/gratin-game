import { useGame, useValidation } from '../state/store';
import { t, type Locale } from '../i18n';

// 第一关的基本规则：全部格子要分完、每个区域都是矩形（带实时 ✓/✗），外加操作说明
export function BasicRules() {
  const level = useGame((s) => s.level);
  const locale = useGame((s) => s.locale) as Locale;
  const validation = useValidation();
  if (!level.basics || !validation) return null;
  const rectOk = validation.hard.length === level.regions.length && validation.hard.every((h) => h.ok);
  const rows: Array<[boolean, string]> = [[validation.complete, t(locale, 'basicAll')], [rectOk, t(locale, 'basicRect')]];
  return (
    <div className="condition-panel basics">
      <div className="cond-group">
        <div className="cond-head">{t(locale, 'basicsTitle')}</div>
        <ul>
          {rows.map(([ok, text]) => (
            <li key={text} className={ok ? 'cond ok' : 'cond bad'}>
              <span className="tick">{ok ? '✓' : '✗'}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="basics-how">{t(locale, 'basicHow')}</p>
      </div>
    </div>
  );
}
