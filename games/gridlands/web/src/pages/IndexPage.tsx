import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../state/store';
import { LEVELS, isUnlocked } from '../levels';
import { Cell } from '../components/Cell';
import { at, seaCoords } from '../components/sea';
import { themeVars } from '../components/themes';
import { Header } from '../components/Header';
import { LanguageSelect } from '../components/LanguageSelect';
import { TERRAIN_STYLE, TerrainIcon, RoleAvatar } from '../components/icons';
import { localized, t, tagName, type Locale } from '../i18n';

// 首页示意图：每次打开随机抽一关。没通关只画地图（不剧透），通关过的画出答案配色
function SampleBoard({ locale }: { locale: Locale }) {
  const passed = useGame((s) => s.passed);
  const pick = () => LEVELS[Math.floor(Math.random() * LEVELS.length)];
  const [level, setLevel] = useState(pick);
  const reroll = () => { let next = pick(); for (let i = 0; i < 5 && next.id === level.id; i++) next = pick(); setLevel(next); };
  const solved = passed.includes(level.id) && !!level.solution;
  const owner: Record<number, string> = {};
  if (solved) level.solution!.forEach((s) => s.cells.forEach((c) => { owner[c] = s.region; }));
  const color = (rid?: string) => level.regions.find((r) => r.id === rid)?.owner.color;
  const { width, height } = level.board;
  const to = isUnlocked(level.id, passed) ? `/levels/${level.id}` : '/levels';
  return (
    <div className="sample-wrap" style={themeVars(level.theme)}>
      <Link to={to} className="sample-link" aria-label={`${level.id} ${localized(level.name, locale)}`}>
        <div className="board sample" style={{ ['--cols' as any]: width, ['--rows' as any]: height, aspectRatio: `${width} / ${height}` }}>
          {seaCoords(level).map(([x, y]) => <div key={`sea-${x}-${y}`} className="sea" style={at(x, y)} />)}
          {level.board.cells.map((c) => {
            const tag = (c.tags || []).find((tg) => tg !== 'plain') ?? null;
            return (
              <Cell key={c.id} cell={c} tag={tag} bg={(TERRAIN_STYLE[tag ?? 'plain'] ?? TERRAIN_STYLE.plain).bg}
                fillColor={solved ? color(owner[c.id]) : undefined} blocked={c.assignable === false}
                preview={false} conflict={false} fixed={!!c.fixedRegion} />
            );
          })}
        </div>
      </Link>
      <div className="sample-caption">
        <Link to={to} className="sample-title">{level.id} · {localized(level.name, locale)}</Link>
        <div className="sample-roles">
          {level.regions.map((r) => <RoleAvatar key={r.id} icon={r.owner.icon} color={r.owner.color} size={20} />)}
        </div>
        <div className="sample-actions">
          <span className="sample-note">{t(locale, solved ? 'sampleSolved' : 'samplePlay')}</span>
          <button type="button" className="sample-shuffle" onClick={reroll}>{t(locale, 'sampleShuffle')}</button>
        </div>
      </div>
    </div>
  );
}

const LEGEND_TAGS = ['farmland', 'forest', 'lake', 'mountain', 'gold', 'iron', 'building'];
const LEGEND_ROLES = ['farmer', 'rancher', 'miner', 'forester', 'developer', 'crown'];
const ROLE_COLORS: Record<string, string> = { farmer: '#4caf50', rancher: '#a1887f', miner: '#ffb300', forester: '#2e7d32', developer: '#8d6e63', crown: '#ffd54f' };

export function IndexPage() {
  const locale = useGame((s) => s.locale) as Locale;

  return (
    <div className="app">
      <Header><LanguageSelect /></Header>

      <main className="page index">
        <section className="hero">
          <img className="hero-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="Gridlands" width={96} height={96} />
          <h1 className="hero-title"><span className="brand-en">Gridlands</span> <span className="brand-zh">阡陌</span></h1>
          <p className="hero-tagline">{t(locale, 'tagline')}</p>
          <Link className="start-btn" to="/levels">{t(locale, 'start')}</Link>
        </section>

        <section className="hero-sample">
          <SampleBoard locale={locale} />
        </section>

        <section className="info-card">
          <h2>{t(locale, 'howToTitle')}</h2>
          <ol className="steps">
            <li>{t(locale, 'step1')}</li>
            <li>{t(locale, 'step2')}</li>
            <li>{t(locale, 'step3')}</li>
          </ol>
        </section>

        <section className="info-card">
          <h2>{t(locale, 'legendTitle')}</h2>
          <div className="legend">
            {LEGEND_TAGS.map((tag) => (
              <div key={tag} className="legend-item">
                <span className="legend-icon" style={{ background: TERRAIN_STYLE[tag]?.bg }}>
                  <TerrainIcon tag={tag} />
                </span>
                <span>{tagName(tag, locale)}</span>
              </div>
            ))}
          </div>
          <div className="legend roles">
            {LEGEND_ROLES.map((icon) => (
              <RoleAvatar key={icon} icon={icon} color={ROLE_COLORS[icon]} size={34} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
