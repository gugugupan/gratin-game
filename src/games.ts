import data from "./games.json";
import { INPUTS, LOCALES, TAGS, type Localized } from "./i18n";

export type Game = {
  id: string;
  title: Localized;
  tagline: Localized;
  url: string;
  repo?: string;
  cover: string;
  tags: string[];
  input: string[];
  languages: string[];
  status: "live" | "soon";
  added: string;
};

export const GAMES = data as Game[];

export const SITE_URL = "https://gugugupan.github.io/gratin-game/";

const NEW_DAYS = 30;

export function isNew(game: Game, now: Date): boolean {
  const added = new Date(`${game.added}T00:00:00Z`).getTime();
  return now.getTime() - added < NEW_DAYS * 86_400_000;
}

export function sortGames(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : 1;
    return b.added.localeCompare(a.added);
  });
}

export function filterByTag(games: Game[], tag: string | null): Game[] {
  return tag ? games.filter((g) => g.tags.includes(tag)) : games;
}

export function usedTags(games: Game[]): string[] {
  const seen = new Set(games.flatMap((g) => g.tags));
  return Object.keys(TAGS).filter((t) => seen.has(t));
}

export function validateGames(games: Game[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const g of games) {
    if (ids.has(g.id)) errors.push(`${g.id}: duplicate id`);
    ids.add(g.id);
    for (const l of LOCALES) {
      if (!g.title?.[l]) errors.push(`${g.id}: missing title.${l}`);
      if (!g.tagline?.[l]) errors.push(`${g.id}: missing tagline.${l}`);
    }
    if (!/^https:\/\//.test(g.url)) errors.push(`${g.id}: url must be https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.added)) errors.push(`${g.id}: added must be YYYY-MM-DD`);
    if (g.status !== "live" && g.status !== "soon") errors.push(`${g.id}: bad status`);
    for (const tag of g.tags) if (!TAGS[tag]) errors.push(`${g.id}: unknown tag ${tag}`);
    for (const i of g.input) if (!INPUTS[i]) errors.push(`${g.id}: unknown input ${i}`);
  }
  return errors;
}
