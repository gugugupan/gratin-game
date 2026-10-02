import { useGame } from '../state/store';
import { LOCALES, t } from '../i18n';

export function LanguageSelect() {
  const locale = useGame((s) => s.locale);
  const setLocale = useGame((s) => s.setLocale);
  return (
    <select aria-label={t(locale, 'language')} value={locale} onChange={(e) => setLocale(e.target.value as any)}>
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
