import { useEffect } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useGame, useValidation } from '../state/store';
import { getLevel, isUnlocked, nextLevel } from '../levels';
import { Board } from '../components/Board';
import { RegionList } from '../components/RegionList';
import { ConditionPanel } from '../components/ConditionPanel';
import { Header } from '../components/Header';
import { LanguageSelect } from '../components/LanguageSelect';
import { t } from '../i18n';
import { StoryCard } from '../components/StoryCard';
import { themeVars } from '../components/themes';

export function PlayPage() {
  const { id } = useParams();
  const passed = useGame((s) => s.passed);
  const loadLevel = useGame((s) => s.loadLevel);
  const markPassed = useGame((s) => s.markPassed);
  const reset = useGame((s) => s.reset);
  const storeLevel = useGame((s) => s.level);
  const locale = useGame((s) => s.locale);
  const validation = useValidation();

  const level = id ? getLevel(id) : undefined;
  const unlocked = level ? isUnlocked(level.id, passed) : false;
  const ready = !!level && unlocked && storeLevel?.id === level.id;
  const won = ready && (validation?.ok ?? false);

  useEffect(() => {
    if (level && unlocked) loadLevel(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unlocked]);

  useEffect(() => {
    if (won && level) markPassed(level.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  if (!level || !unlocked) return <Navigate to="/levels" replace />;

  const nxt = nextLevel(level.id);

  return (
    <div className="app themed" style={themeVars(level.theme)}>
      <Header>
        <Link className="btn-link" to="/levels">‹ {t(locale, 'backToLevels')}</Link>
        <button onClick={reset}>{t(locale, 'reset')}</button>
        <LanguageSelect />
      </Header>

      <main className="layout">
        <section className="board-area">
          <StoryCard key={level.id} level={level} locale={locale} />
          {ready ? <Board /> : null}
          {won && (
            <div className="win-banner">
              <span>{t(locale, 'win')}</span>
              {nxt && <Link className="next-btn" to={`/levels/${nxt.id}`}>{t(locale, 'nextLevel')} ›</Link>}
            </div>
          )}
        </section>

        <aside className="side">
          {ready && (
            <>
              <RegionList />
              <ConditionPanel />
              <p className="rules">{t(locale, 'rules')}</p>
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
