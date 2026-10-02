# グラタンゲーム · Gratin Game

焼きたての HTML ゲーム、そろってます。A library page for all of my browser games.

**▶ https://gugugupan.github.io/gratin-game/**

## Add a game

1. Put a 16:10 screenshot in `public/covers/<id>.jpg` (about 900 px wide).
2. Add an entry to `src/games.json`. Every `title` and `tagline` needs `ja`, `zh` and `en`. Tags and input types must exist in `src/i18n.ts`.
3. Run `npm test`. It checks the data and that the cover file exists.

`status: "soon"` shows a card that can't be clicked yet. Games added within the last 30 days get a NEW badge.

## Development

```bash
npm install
npm run dev     # http://localhost:5190
npm test
npm run build
npm run brand   # regenerate brand/ and the icons in public/
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

Brand guide and logo files: [`brand/BRAND.md`](brand/BRAND.md).
