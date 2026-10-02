import { Link } from 'react-router-dom';
import { useGame } from '../state/store';
import { getLevel } from '../levels';
import { Header } from '../components/Header';
import { LanguageSelect } from '../components/LanguageSelect';
import { TERRAIN_STYLE, TerrainIcon, RoleAvatar } from '../components/icons';
import { t, tagName, type Locale } from '../i18n';

// 用 1-1 的标准解渲染一个静态「已解好」的小棋盘，当作示意图
function SampleBoard() {
  const level = getLevel('1-1');
  if (!level || !level.solution) return null;
  const color: Record<string, string> = Object.fromEntries(level.regions.map((r) => [r.id, r.owner.color]));
  const cellRegion: Record<number, string> = {};
  level.solution.forEach((s) => s.cells.forEach((c) => { cellRegion[c] = s.region; }));
  const ordered = [...level.board.cells].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  return (
    <div className="board sample" style={{ ['--cols' as any]: level.board.width, ['--rows' as any]: level.board.height, aspectRatio: `${level.board.width} / ${level.board.height}` }}>
      {ordered.map((c) => {
        const tag = (c.tags || []).find((tg) => tg !== 'plain') || null;
        return (
          <div key={c.id} className="cell assigned" style={{ ['--region' as any]: color[cellRegion[c.id]] }}>
            {tag ? <TerrainIcon tag={tag} /> : null}
          </div>
        );
      })}
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
          <SampleBoard />
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
