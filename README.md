# グラタンゲーム · Gratin Game

焼きたての HTML ゲーム、そろってます。A library page for all of my browser games.

**▶ https://gugugupan.github.io/gratin-game/**

## Add a game

1. Put a 16:10 screenshot in `public/covers/<id>.jpg` (about 900 px wide).
2. Add an entry to `src/games.json`. Every `title` and `tagline` needs `ja`, `zh` and `en`. Tags and input types must exist in `src/i18n.ts`.
3. Run `npm test`. It checks the data and that the cover file exists.

`status: "soon"` shows a card that can't be clicked yet. Games added within the last 30 days get a NEW badge.

## Games inside this repo

Most games live in their own repos and are only linked from `src/games.json`. Some games live here under `games/<id>/` and deploy with the site to `https://gugugupan.github.io/gratin-game/<id>/`:

| Game | Source | Build output |
|---|---|---|
| Gridlands 阡陌 | `games/gridlands/` (web app in `web/`) | `dist/gridlands/` |

To move another game in:

1. Copy it to `games/<id>/` and add its web package to `workspaces` in `package.json`.
2. Make sure its build uses relative paths (Vite `base: "./"`, hash routing or no routing).
3. Add `"<id>": "games/<id>/.../dist"` to `games/builds.json`.
4. Point its `url` in `src/games.json` at `https://gugugupan.github.io/gratin-game/<id>/`.
5. Add its tests to `test:all` in `package.json`.

`npm test` fails if `games.json` and `games/builds.json` disagree.

## Development

```bash
npm install
npm run dev     # http://localhost:5190
npm test        # site only
npm run test:all   # site + every game in games/
npm run build:all  # site + games, assembled into dist/
npm run brand   # regenerate brand/ and the icons in public/
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

Brand guide and logo files: [`brand/BRAND.md`](brand/BRAND.md).
