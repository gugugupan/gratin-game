import { Link } from 'react-router-dom';
import { useGame } from '../state/store';
import { LEVELS, isUnlocked } from '../levels';
import { Header } from '../components/Header';
import { LanguageSelect } from '../components/LanguageSelect';
import { localized, t } from '../i18n';
import { MiniBoard } from '../components/MiniBoard';
import { RoleAvatar } from '../components/icons';

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
                <div className="lvl-thumb">
                  <MiniBoard level={l} />
                  {!unlocked && (
                    <span className="lvl-lock" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                    </span>
                  )}
                </div>
                <div className="lvl-id">{l.id}{done && <span className="lvl-check">✓</span>}</div>
                <div className="lvl-name">{unlocked ? localized(l.name, locale) : '— — —'}</div>
                <div className="lvl-roles">
                  {l.regions.map((r) => <RoleAvatar key={r.id} icon={r.owner.icon} color={r.owner.color} size={22} />)}
                </div>
                <div className="lvl-status">
                  {done ? t(locale, 'cleared') : unlocked ? '' : t(locale, 'locked')}
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
