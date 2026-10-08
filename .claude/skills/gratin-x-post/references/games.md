# Games — postable facts and media recipes

Source of truth for the list: `src/games.json` (title/tagline/url/languages). Re-check facts in each game's code before quoting numbers.

## 🍋 レモンパンチ / Lemon Punch — `~/workspace/fde/cc-lemon-web`
- Rhythm battle: chant レ・モン・ジャン・ケン, act on beat 4 (「ケン」). Actions ため/ガード/攻撃/必殺技 (必殺技 costs 3 energy).
- Goal 20 wins in a row (then endless). 8 characters, unlocked by playing. Tutorial = 5 fights ending with レモン仙人.
- 10 actions in a row → FEVER (yellow screen edges); a wait breaks it. Shop with items/relics, treasure chest each visit.
- Languages ja/zh; keyboard (←↑→↓, 1–4 items) + touch.
- **Video**: dev server `cc-lemon-web` (5188). `node scripts/record-lemon.mjs 45 <raw> 8` records fight 8 (♩~133). Pick a 13 s window ending ~1.5 s after the `end` entry in log.json (KO → 「勝ち！」 panel) and containing a `special`. Bot policy: guard vs attack/special, special at ≥3 energy, else charge.
- Endcard: `node scripts/endcard.mjs cc-lemon-battle.jpg レモンパンチ 4拍目の「ケン」で技を出せ！ lemon-punch.gratin-game.com <out.png>`
- Existing: `marketing/lemon-punch-x.mp4` (posted 2026-10-07).

## 🧱 カチッとタウン / Clickton — `~/workspace/fde/clickton`
- Endless tile placement brick town; tiles: city/road/rail/water/forest/field…; completed rails spawn trains, roads spawn cars, people and pets move in.
- Day/night: one day = 240 s (4 min); night = lit windows, street lights, car headlights.
- 7 random themes per town (ja names in src/i18n.ts, e.g. 水の郷 = waterside). Quests → landmarks (13, animated).
- デイリーチャレンジ: everyone gets the same fixed tile set that day ("今日はみんな同じ N 枚").
- Share button → link with replay of the town. Generative marimba BGM.
- ja/zh/en; mouse + touch (works on phones).
- **Still**: `node scripts/shot-clickton.mjs <out> 40 classic 1.6 0.8` (night; 0.66 dusk, 0.3 day). UI hidden. Random seed each run — take 2–3, keep best.
- **Video**: `node scripts/record-clickton.mjs 50 <raw> 90 classic` → build 0.6–11.7 s, orbit after; window 0.6→13.8.
- Endcard: `node scripts/endcard.mjs clickton.jpg カチッとタウン タイルをカチッと、町ができる。 clickton.gratin-game.com <out.png>`
- Existing: `marketing/clickton-x.mp4` (posted 2026-10-06), `marketing/clickton-night.png` (scheduled 2026-10-07 18:00).

## 🔲 阡陌 / Gridlands — `~/workspace/fde/gratin-game/games/gridlands`
- Split the map into rectangles that satisfy every clue; every level is solvable by pure deduction (no guessing) — the core selling point.
- 5 chapters × 8 levels = 40 (levels/*.json). Ch5 「铁路通车」 = railways (ja story text exists); each level has a story card.
- zh/ja/en; mouse + touch.
- **Stills**: `node scripts/shot-gridlands.mjs <level> <out>` (live site, ja). Unsolved for the post, solved for the self-reply 「答えはこちら」.
- Existing: `marketing/gridlands-5-3*.png` (posted 2026-10-07).

## 紙上防疫 / Paper Quarantine — `games/paper-quarantine`
- Added 2026-10-07 by another session. Move two agents at once, stop three viruses on a paper map, finish three vaccines within 12 rounds.
- **Chinese only** (`languages: ["zh"]`) — do not promote on the Japanese timeline yet; ask the user.

## 🏢 Return to Office — `games/rto` (ja/zh/en)
- Puzzle + story: new manager schedules 6 members (小林/佐藤/田中/王さん/阿部/鈴木) over 10 weeks; quota grows 1 → 2 → 3 days a week (鈴木 2 as an exception); every week has exactly one answer (`npm test -w games/rto`). Story via Mail/Chat/1on1 (2 replies: まじめに / 突拍子もなく), ending = All Hands group photo (spoiler — don't post it before players have had time).
- Media: `http://localhost:5250/?cover=meet&lang=ja` (1on1 with 阿部, choice buttons) or `?cover=grid&lang=ja` (week 2 schedule); headless Chrome `--force-device-scale-factor=2 --window-size=1216,760`. Launch config `rto`.
- Hashtags: no work tag yet; used `#ブラウザゲーム #個人開発`.

## Portal
- グラタンゲーム itself: logo story (cheese strand), loader animation `brand/loader.svg`, games added over time — good for dev-story posts.
- **Logo clip**: `node scripts/record-logo.mjs <out.mp4>` → 5.4 s silent 1080² loop (wordmark + loader.svg). Existing: `marketing/logo-cheese.mp4` (scheduled 2026-10-08 12:30).
