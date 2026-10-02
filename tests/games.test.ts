import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GAMES, SITE_URL, filterByTag, isNew, sortGames, usedTags, validateGames, type Game } from "../src/games";
import { detectLocale } from "../src/i18n";

describe("games.json", () => {
  it("is valid", () => {
    expect(validateGames(GAMES)).toEqual([]);
  });

  it("builds every game hosted on this site from games/", () => {
    const root = path.join(import.meta.dirname, "..");
    const builds: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, "games/builds.json"), "utf8"));
    const hosted = GAMES.flatMap((g) => {
      const m = g.url.match(new RegExp(`^${SITE_URL.replace(/[.]/g, "\\.")}([^/]+)/$`));
      return m ? [m[1]] : [];
    });
    expect(hosted.sort()).toEqual(Object.keys(builds).sort());
    for (const [id, out] of Object.entries(builds)) {
      expect(fs.existsSync(path.join(root, `games/${id}`)), id).toBe(true);
      expect(out.startsWith(`games/${id}/`), out).toBe(true);
    }
  });

  it("has a cover file for every game", () => {
    for (const g of GAMES) {
      expect(fs.existsSync(path.join(import.meta.dirname, "../public", g.cover)), g.cover).toBe(true);
    }
  });
});

const game = (over: Partial<Game>): Game => ({
  id: "x",
  title: { ja: "x", zh: "x", en: "x" },
  tagline: { ja: "x", zh: "x", en: "x" },
  url: "https://example.com/",
  cover: "covers/x.jpg",
  tags: [],
  input: [],
  languages: [],
  status: "live",
  added: "2026-01-01",
  ...over,
});

describe("library logic", () => {
  it("sorts live games first, newest first", () => {
    const sorted = sortGames([
      game({ id: "old", added: "2026-01-01" }),
      game({ id: "soon", status: "soon", added: "2026-12-01" }),
      game({ id: "new", added: "2026-06-01" }),
    ]);
    expect(sorted.map((g) => g.id)).toEqual(["new", "old", "soon"]);
  });

  it("filters by tag and lists only used tags in catalog order", () => {
    const list = [game({ id: "a", tags: ["puzzle"] }), game({ id: "b", tags: ["rhythm", "puzzle"] })];
    expect(filterByTag(list, "rhythm").map((g) => g.id)).toEqual(["b"]);
    expect(filterByTag(list, null)).toHaveLength(2);
    expect(usedTags(list)).toEqual(["rhythm", "puzzle"]);
  });

  it("marks games added in the last 30 days as new", () => {
    const g = game({ added: "2026-10-01" });
    expect(isNew(g, new Date("2026-10-15T00:00:00Z"))).toBe(true);
    expect(isNew(g, new Date("2026-11-15T00:00:00Z"))).toBe(false);
  });

  it("flags bad entries", () => {
    const errors = validateGames([game({ tags: ["nope"], url: "http://x" }), game({})]);
    expect(errors).toContain("x: unknown tag nope");
    expect(errors).toContain("x: url must be https");
    expect(errors).toContain("x: duplicate id");
  });
});

describe("detectLocale", () => {
  it("picks the first supported language", () => {
    expect(detectLocale(["fr-FR", "zh-CN", "ja"])).toBe("zh");
    expect(detectLocale(["en-US"])).toBe("en");
    expect(detectLocale(["ko"])).toBe("ja");
  });
});
