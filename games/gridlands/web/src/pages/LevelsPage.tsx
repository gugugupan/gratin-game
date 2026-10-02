import { Link } from 'react-router-dom';
import { useGame } from '../state/store';
import { LEVELS, isUnlocked } from '../levels';
import { Header } from '../components/Header';
import { LanguageSelect } from '../components/LanguageSelect';
import { localized, t } from '../i18n';

export function LevelsPage() {
  const passed = useGame((s) => s.passed);
  const locale = useGame((s) => s.locale);

  return (
    <div className="app">
      <Header><LanguageSelect /></Header>
      <main className="page">
        <h2 className="page-title">{t(locale, 'levelsTitle')}</h2>
        <div className="levels-grid">
          {LEVELS.map((l) => {
            const unlocked = isUnlocked(l.id, passed);
            const done = passed.includes(l.id);
            const body = (
              <>
                <div className="lvl-id">{l.id}{done && <span className="lvl-check">✓</span>}</div>
                <div className="lvl-name">{unlocked ? localized(l.name, locale) : '— — —'}</div>
                <div className="lvl-status">
                  {done ? t(locale, 'cleared') : unlocked ? '' : `🔒 ${t(locale, 'locked')}`}
                </div>
              </>
            );
            return unlocked ? (
              <Link key={l.id} className={'lvl-card' + (done ? ' done' : '')} to={`/levels/${l.id}`}>{body}</Link>
            ) : (
              <div key={l.id} className="lvl-card locked" title={t(locale, 'lockedHint')}>{body}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
