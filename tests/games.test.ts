import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GAMES, SITE_URL, isNew, sortGames, validateGames, type Game } from "../src/games";
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

  it("keeps game build ids clear of site pages", () => {
    const builds = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../games/builds.json"), "utf8"));
    expect(Object.keys(builds)).not.toContain("privacy");
  });

  it("has a cover file for every game", () => {
    for (const g of GAMES) {
      expect(fs.existsSync(path.join(import.meta.dirname, "../public", g.cover)), g.cover).toBe(true);
    }
  });

  it("has the preview file for every game that lists one", () => {
    for (const g of GAMES.filter((g) => g.preview)) {
      expect(fs.existsSync(path.join(import.meta.dirname, "../public", g.preview!)), g.preview).toBe(true);
    }
  });
});

const game = (over: Partial<Game>): Game => ({
  id: "x",
  title: { ja: "x", zh: "x", en: "x" },
  tagline: { ja: "x", zh: "x", en: "x" },
  url: "https://example.com/",
  cover: "covers/x.jpg",
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

  it("marks games added in the last 30 days as new", () => {
    const g = game({ added: "2026-10-01" });
    expect(isNew(g, new Date("2026-10-15T00:00:00Z"))).toBe(true);
    expect(isNew(g, new Date("2026-11-15T00:00:00Z"))).toBe(false);
  });

  it("flags bad entries", () => {
    const errors = validateGames([game({ url: "http://x" }), game({})]);
    expect(errors).toContain("x: url must be https");
    expect(errors).toContain("x: duplicate id");
    expect(validateGames([game({ preview: "covers/x.gif" })])).toContain("x: preview must be previews/<name>.mp4");
  });
});

describe("detectLocale", () => {
  it("prefers Japanese whenever the browser accepts it", () => {
    expect(detectLocale(["en-US", "zh-CN", "ja-JP"])).toBe("ja");
  });
  it("otherwise picks the first supported language, defaulting to Japanese", () => {
    expect(detectLocale(["fr-FR", "zh-CN", "en"])).toBe("zh");
    expect(detectLocale(["en-US"])).toBe("en");
    expect(detectLocale(["ko"])).toBe("ja");
  });
});
