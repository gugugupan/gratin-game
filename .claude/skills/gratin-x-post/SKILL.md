---
name: gratin-x-post
description: Run the グラタンゲーム X/Twitter account (@gratingame) — check how recent posts did, pick the next branding topic, write the Japanese post, make the screenshot or 15 s video from the real games, fill the X composer in the user's Chrome and post or schedule it after the user confirms. Use whenever the user asks to post/tweet/schedule something for gratin-game, Lemon Punch (レモンパンチ), Clickton (カチッとタウン/咔哒镇), Gridlands (阡陌) or Paper Quarantine, asks how the X account is doing, wants post ideas or a week of posts, or says "发一条推", "排下周的推", "看看推特数据" — even without naming the skill.
---

# gratin-x-post

Branding posts for **@gratingame** (https://x.com/gratingame), the account of the game portal https://gratin-game.com. Talk to the user in Chinese; posts are Japanese-first.

## Hard rules
- **Never press ポストする / 予約設定 / 返信 / いいね without the user's explicit OK in chat for that exact post.** Fill the composer, screenshot it, show text + media + time, wait. One OK covers one post (a batch OK covers the listed posts only). If the user edits the composer themselves, re-screenshot and confirm what is there before clicking.
- Do not reply to, like, repost or follow other accounts. Investigation is read-only; list interesting posts for the user to engage with.
- Facts in a post must come from the game code / games.json, not memory (level counts, theme names, character counts). Check before writing.
- Never write 「CCレモン」 in a post or hashtag (trademark — the game was renamed レモンパンチ for this). Nostalgia wording like 「子どもの頃の手遊び」 is fine.
- Stage only files you created when committing; `marketing/` stays untracked.

## Workflow

### 0. Make sure Chrome is acting as @gratingame
Load the Chrome tools (`tabs_context_mcp` with `createIfEmpty`, `navigate`, `find`, `get_page_text`, `computer`, `form_input`, `file_upload`, `tabs_close_mcp`). If the extension is not connected, tell the user to install/sign in (https://chromewebstore.google.com/detail/fcoeoabgfenejglbffodgkkbkcdhcgfn) and stop.
- Open `https://x.com/home`, `find` "account switcher button at the bottom of the left sidebar" (label アカウントメニュー) and `read_page` that ref — its child text is the active `@handle`.
- Not `@gratingame` → click the button (if `find` can't see the popover, click the button's screen position and zoom the area above it). The menu lists every account signed in on this browser, the active one with a green ✓ (seen 2026-10-08: @gratingame and the user's personal @gugugupan), then 既存のアカウントを追加 / アカウントを管理 / @…からログアウト. Click the `@gratingame` row only — never the ログアウト item. Wait, reload `/home`, `read_page` the button again.
- **Fail and stop the run** — before reading stats or touching the composer — if `@gratingame` is not in the menu, clicking it leads to a login page / password prompt / verification step, or the handle still isn't `@gratingame` after switching. Tell the user which account Chrome is on and ask them to sign in to @gratingame themselves (add it via 「既存のアカウントを追加」). Never type a username, password or code.
- Re-read the bottom-left handle right before pressing ポストする / 予約設定; if it changed, stop.
- If the run switched accounts, say so in the report; don't switch back unless the user asks.

### 1. Investigate (Claude in Chrome — the user's logged-in browser)
- `https://x.com/gratingame` → follower/following/post counts (`get_page_text`), then `find` "reply/repost/like/view count groups for each post" to read per-post stats (timeline articles are not in page text).
- `https://x.com/compose/post/unsent/scheduled` → what is already queued (screenshot; the page has no text content).
- Optionally browse `https://x.com/search?q=%23インディーゲーム&f=live` (and #ブラウザゲーム, #箱庭ゲーム, #リズムゲーム) for what similar devs post — read only.
- Update `marketing/post-log.md` (see format below): fill URLs/stats for posts that went out since last run.
- Report to the user in a short table: last posts with views/likes, follower delta, what's queued, 2–3 observations.

### 2. Pick the topic
Read `references/topics.md` and the log. Rules:
- Rotate games; same game at most once per 2 days; alternate promo (with link reply) and everyday posts.
- Saturday → add `#screenshotsaturday` to a visual post. Weekday 18:00–19:30 JST suits commute/phone angles; 20:00–22:00 suits sound-on video (rhythm game).
- Paper Quarantine (紙上防疫) is Chinese-only — don't promote it to the Japanese timeline until games.json lists `ja` in its languages; tell the user instead.
- Default is **one** post per run; "排一周 / a week" = 3–5 posts, each scheduled.

### 3. Write the post
- Voice and hashtags: `references/brand.md`. Game facts: `references/games.md` (verify against code/games.json when in doubt).
- Count with `python3 scripts/xcount.py < post.txt` — must be ≤ 280 (CJK = 2).
- Promo posts: link goes in a **self-reply**, not the main post (X downranks link posts). Draft the reply too.

### 4. Make the media (`references/games.md` has per-game recipes)
Scripts live in `scripts/` (run `npm install` there once; uses the cached Playwright Chromium). Dev servers via `preview_start` names `cc-lemon-web` (5188) / `clickton` (5189) from `~/workspace/.claude/launch.json` — if another chat already runs one, reuse it, don't stop it.
- Clickton still: `node scripts/shot-clickton.mjs <out> 40 classic 1.6 0.8` (night). Run 2–3 times, view, keep the best.
- Gridlands: `node scripts/shot-gridlands.mjs 5-3 <out>` → unsolved + solved.
- Logo / brand: `node scripts/record-logo.mjs <out.mp4>` → silent 5.4 s cheese-drip loop.
- Video: `record-lemon.mjs` / `record-clickton.mjs` → pick the window from log.json → `endcard.mjs` → `compose-video.py` (1:1 1080², ~15 s, −22 LUFS — the user found louder versions too loud).
- Always look at the result (Read the PNG / a contact sheet of video frames) before using it. Save finals to `~/workspace/fde/gratin-game/marketing/`.

### 5. Fill the composer
- Go to `https://x.com/home` and use the **inline** composer at the top (navigating to /compose/post opened a separate modal last time and the typed text was lost). Click the textbox, `type` the text, press Escape to close the hashtag suggestion popup.
- Media: `find` "media file input" → `file_upload` with the absolute path (≤10 MB per call — videos from compose-video.py are ~7 MB).
- Schedule: click the schedule icon (`ポストを予約`) → set hour/minute/AM-PM with `form_input` on the comboboxes → zoom-check the line 「…に送信されます」 → `確認する`. The submit button then reads 予約設定.
- Screenshot the filled composer and ask the user to confirm. **Stop here until they say OK.**

### 6. After OK
Click ポストする / 予約設定, then verify (profile timeline for immediate posts; `/compose/post/unsent/scheduled` for scheduled ones; `/compose/post/unsent/drafts` should be empty). For immediate promo posts, post the self-reply only after confirming its text too. Close the tab you opened.

### 7. Log
Append to `~/workspace/fde/gratin-game/marketing/post-log.md` (create with the header below if missing):
```
| date (JST) | status | game | type | text (first line) | media | url | views | likes | replies |
```
status = scheduled / posted. Fill url and stats on the next run. The log is what marks a topic as used; when you add new ideas or approved drafts to `references/topics.md`, commit that file to gratin-game `main` (stage only that file).
