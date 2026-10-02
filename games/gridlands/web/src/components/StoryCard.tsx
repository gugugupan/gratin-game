import type { Level } from '../core/engine';
import { localized, t, type Locale } from '../i18n';
import { themeIcon } from './themes';

export function StoryCard({ level, locale }: { level: Level; locale: Locale }) {
  if (!level.story) return null;
  return (
    <details className="story" open>
      <summary>
        <img className="story-icon" src={themeIcon(level.theme)} alt="" draggable={false} />
        <span className="story-head">
          <span className="story-label">{level.id} · {t(locale, 'story')}</span>
          <span className="story-title">{localized(level.name, locale)}</span>
        </span>
      </summary>
      <p>{localized(level.story, locale)}</p>
    </details>
  );
}
