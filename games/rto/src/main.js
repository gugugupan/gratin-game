import './style.css';
import { solve, evalC, allConstraints, resolve } from './engine.js';
import { T, ORDER, CAST, LEVELS } from './levels.js';
import { COMPANY, EMAILS, CHATS, TALKS, FINALE, BEATS } from './story.js';
import { loadLocale, saveLocale } from './locale.js';
import { loadFonts } from './fonts.js';

const SHARE_URL = `${import.meta.env.VITE_SITE_URL || 'https://gratin-game.com/'}rto/`;
const UI = {
  title: T('Return to Office', 'Return to Office', 'Return to Office'),
  appName: T('工作台', 'Workspace', 'ワークスペース'),
  notifFrom: T('人事部', 'People Team', '人事部'),
  notifNow: T('刚刚', 'now', 'たった今'),
  notifNew: T('欢迎加入一个公司！你是开发二组的新任经理，手下有 6 名成员。打开「工作台」，开始今天的工作吧。', 'Welcome to A Company! You are the new manager of Dev Team 2, with six people on your team. Open Workspace to start your day.', 'ある会社へようこそ！あなたは開発2課の新任マネージャー、メンバーは6人です。「ワークスペース」を開いて、今日の仕事を始めましょう。'),
  notifBack: T('欢迎回来，经理。团队还在等你，打开「工作台」继续今天的工作。', 'Welcome back, manager. Your team is waiting. Open Workspace to pick up where you left off.', 'おかえりなさい、マネージャー。チームが待っています。「ワークスペース」を開いて仕事の続きを。'),
  apps: { grid: T('排班', 'WeekGrid', 'シフト'), mail: T('邮件', 'Mail', 'メール'), chat: T('聊天', 'Chat', 'チャット'), meet: T('会议', 'Meet', '会議') },
  ending: T('结局', 'Ending', 'エンディング'),
  week: T('第 {n} 周', 'Week {n}', '第{n}週'),
  team: T('开发二组', 'Dev Team 2', '開発2課'),
  attend: T('出勤率', 'Attendance', '出社率'),
  target: T('目标', 'target', '目標'),
  undo: T('撤销', 'Undo', '元に戻す'),
  clear: T('清空', 'Clear', 'クリア'),
  hint: T('提示', 'Hint', 'ヒント'),
  submit: T('提交排班', 'Submit schedule', 'シフトを提出'),
  submitted: T('已提交', 'SUBMITTED', '提出済'),
  requests: T('成员申请', 'Requests', '申請'),
  met: T('已满足', 'met', '達成'),
  hq: T('HQ 规定', 'HQ policy', 'HQ規定'),
  office: T('办公室', 'Office', 'オフィス'),
  ga: T('总务部通知', 'from General Affairs', '総務部より'),
  office_tx: T('出社', 'Office', '出社'),
  home_tx: T('在宅', 'Remote', '在宅'),
  reqTag: T('申请', 'REQ', '申請'),
  noDayReq: T('这一天没有特殊安排', 'Nothing special this day', 'この日は特別な条件なし'),
  reqLong: T('本人申请在宅，不能更改', 'Remote at the member\'s request, cannot change', '本人の申請で在宅、変更不可'),
  inbox: T('收件箱', 'Inbox', '受信トレイ'),
  to: T('收件人', 'To', '宛先'),
  people: T('人', '', '人'),
  meeting: T('1:1 · {n}', '1:1 · {n}', '1on1・{n}'),
  endcall: T('结束会议', 'End meeting', '会議を終了'),
  leave: T('离开会议', 'Leave meeting', '退出する'),
  unlocked: T('心结解开了', 'SOMETHING CHANGED', 'わだかまりが解けた'),
  choiceA: T('正经回答', 'SAY IT STRAIGHT', 'まじめに'),
  choiceB: T('天马行空', 'WILD IDEA', '突拍子もなく'),
  cont: T('继续', 'Continue', '続ける'),
  allhands: T('All Hands · 全员大会', 'All Hands', 'All Hands・全社会'),
  takePhoto: T('拍合影', 'Take the photo', '写真を撮る'),
  live: T('进行中', 'Live', 'ライブ'),
  recordings: T('录像', 'Recordings', '録画'),
  replay: T('录像回放', 'Recording', '録画'),
  waiting: T('{n} 在等你', '{n} is waiting', '{n}さんが待っています'),
  groups: T('群聊', 'Group chats', 'グループ'),
  members: T('{n} 位成员', '{n} members', 'メンバー{n}人'),
  emptyMail: T('还没有邮件', 'No mail yet', 'メールはまだありません'),
  emptyChat: T('还没有群聊', 'No chats yet', 'チャットはまだありません'),
  emptyMeet: T('没有安排会议', 'No meetings scheduled', '予定された会議はありません'),
  emptyHint: T('有新消息时，左边会出现红点。', 'A red dot appears on the left when something new arrives.', '新着があると左に赤い点が付きます。'),
  noWeek: T('第 1 周的排班还没开放', 'Week 1 is not open yet', '第1週のシフトはまだ公開されていません'),
  noWeekHint: T('先看看收到的邮件吧。', 'Check your mail first.', 'まずはメールを確認しよう。'),
  waitNext: T('下一周的排班还没开放：先看完新消息。', 'Next week opens after you catch up on new messages.', '新着を確認すると次の週が公開されます。'),
  newMail: T('新邮件', 'New mail', '新着メール'),
  newChat: T('新群聊', 'New group chat', '新しいグループ'),
  newMeet: T('会议邀请', 'Meeting invite', '会議の招待'),
  newWeek: T('排班已开放', 'Schedule open', 'シフト公開'),
  weekOpen: T('第 {n} 周可以排班了', 'Week {n} is ready to schedule', '第{n}週のシフトを組めます'),
  viewPhoto: T('查看合影', 'View the photo', '集合写真を見る'),
  endTitle: T('全员到齐', 'Everyone came in', '全員そろった'),
  endP: T('10 周，6 个不想回办公室的人，一张合影。', '10 weeks, 6 people who did not want to come back, 1 group photo.', '10週間、出社したくなかった6人と、1枚の集合写真。'),
  shareTx: T('我在《Return to Office》里，让 6 个不想回办公室的人一起拍了一张合影。#ReturnToOffice', 'I got 6 people who did not want to return to the office into one group photo. #ReturnToOffice', '「Return to Office」で、出社したくなかった6人を1枚の集合写真に収めました。#ReturnToOffice'),
  copy: T('复制分享文字', 'Copy share text', 'シェア文をコピー'),
  copied: T('已复制', 'Copied', 'コピーしました'),
  again: T('从头再玩', 'Play again', '最初から'),
  photoBy: T('按下快门的是你。', 'You took the photo.', 'シャッターを押したのはあなた。'),
  caption: T('开发二组 · 2026.12.17', 'Dev Team 2 · 2026.12.17', '開発2課・2026.12.17'),
  banner: T('ALL HANDS', 'ALL HANDS', 'ALL HANDS'),
  weekOf: T('第 {n} 周结束', 'Week {n} done', '第{n}週 終了'),
  next: T('下一步', 'Next', '次へ'),
  skipTut: T('跳过', 'Skip', 'スキップ'),
  done: T('开始排班', 'Start', 'はじめる'),
  tut: [
    T('点一下格子安排「出社」，再点一下标成「在宅」，第三下清空。右键或长按直接标在宅。没排出社的格子提交时都算在宅，标出来只是方便你推理。', 'Click a cell to put someone in the office. Click again to mark remote, a third time to clear. Right-click or long-press marks remote directly. Unassigned cells count as remote when you submit; marking them just helps you think.', 'マスをクリックで「出社」、もう一度で「在宅」、3回目でクリア。右クリック／長押しで直接「在宅」。空いたマスは提出時に在宅扱い。印は推理用のメモです。'),
    T('把鼠标移到成员上（手机上点一下），可以看到他的全部需求，✓ 表示全部满足，✕ 表示有冲突。星期几也一样，带橙色标记的日子有特殊安排。', 'Hover a member (tap on phones) to see everything they need: ✓ means all met, ✕ means a conflict. Day headers work the same way; orange-marked days have special arrangements.', 'メンバーにカーソルを合わせる（スマホはタップ）と条件が見えます。✓は全部達成、✕は矛盾あり。曜日も同じで、オレンジの印がある日は特別な条件があります。'),
    T('这里是所有申请。满足后变绿，鼠标移上去会高亮相关的格子。', 'All requests live here. They turn green when met; hover one to highlight the cells it touches.', 'すべての申請はここ。達成すると緑に。カーソルを合わせると関係するマスが光ります。'),
    T('出勤率目标在这里。每列底部是当天人数和上限。', 'Here is the attendance target. Column footers show headcount and limits for each day.', '出社率の目標はここ。列の下はその日の人数と上限です。'),
    T('全部满足后提交排班。每周只有一个正确答案，靠推理就能找到。', 'When everything is met, submit. Every week has exactly one answer, and logic alone gets you there.', 'すべて達成したら提出。答えは毎週1つだけ、推理だけでたどり着けます。'),
  ],
};
const DAY = { zh: ['周一', '周二', '周三', '周四', '周五'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ja: ['月', '火', '水', '木', '金'] };
const LOC = { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP' };

const ICON = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12M8 2v4M16 2v4"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  meet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V5l7-2v18M12 8h7v13M3 21h18"/></svg>',
  off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>',
};

const store = {
  get(k, d) { try { const v = localStorage.getItem('rto:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('rto:' + k, JSON.stringify(v)); } catch {} },
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = id => document.getElementById(id);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let S;
const tr = o => (o && typeof o === 'object' && 'zh' in o) ? o[S.lang] : o;
const u = (k, vars) => { let s = tr(UI[k]); for (const v in vars || {}) s = s.replace('{' + v + '}', vars[v]); return s; };
const nm = id => tr(CAST[id].name);
const AVATARS = new Set(['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki', 'kuroda', 'mori', 'nakamura']);
const PORTRAITS = new Set(['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki', 'kuroda', 'mori']);
const av = id => AVATARS.has(id)
  ? `<div class="av pic2" style="--h:${CAST[id].hue}" aria-hidden="true"><img src="art/avatar-${id}.jpg" alt="" loading="lazy"></div>`
  : `<div class="av ${CAST[id].gray ? 'gray' : ''}" style="--h:${CAST[id].hue}" aria-hidden="true">${esc(tr(CAST[id].ini))}</div>`;
const BGS = new Set(['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki', 'kuroda', 'mori', 'me']);
const face = id => PORTRAITS.has(id) ? `<div class="porw" style="--bd:${(3 + (CAST[id].hue % 9) / 6).toFixed(2)}s;--dl:-${((CAST[id].hue % 7) / 3).toFixed(2)}s"><img class="por" src="art/portrait-${id}.png" alt=""></div>` : av(id);
function moodOf(text) {
  const t = tr(text) || '';
  if (/笑|laughs|（笑）/.test(t)) return 'laugh';
  if (/^(……|\.\.\.)/.test(t)) return 'droop';
  return '';
}
function tile(id, { speak = false, listen = false, mood = '', bgId = id } = {}) {
  const bg = BGS.has(bgId) ? `background-image:linear-gradient(rgba(10,12,16,0) 40%,rgba(10,12,16,.45)),url(art/bg-${bgId}.jpg);background-size:cover;background-position:center;` : '';
  return `<div class="tile ${speak ? 'speak' : ''} ${speak ? mood : ''} ${listen ? 'listen' : ''}" style="--h:${CAST[id].hue};${bg}">${face(id)}<span class="nm">${speak ? '<i class="eq"><b></b><b></b><b></b></i>' : ''}${esc(nm(id))}</span></div>`;
}

function freshState(lang) {
  return { lang, lv: -1, done: [], feed: [], picks: {}, grids: {}, tut: false, gridSeen: {}, ended: false, view: { app: 'grid', mail: null, chat: null, meet: null, week: null } };
}
function snapshot() {
  return { lang: S.lang, lv: S.lv, done: [...S.done], feed: S.feed, picks: S.picks, grids: S.grids, tut: S.tut, gridSeen: S.gridSeen, ended: S.ended, view: S.view };
}
function start(data) {
  const saved = data && data.feed ? data : store.get('state', null);
  S = Object.assign(freshState(loadLocale()), saved || {}, { lang: loadLocale() });
  S.done = new Set(S.done);
  loadFonts(S.lang);
  S.hist = []; S.tk = null; S.anim = null; S.timer = null;
  bindGlobal();
  showDesktop();
}
function showDesktop() {
  S.open = false;
  $('screen').hidden = true;
  $('desktop').hidden = false;
  renderDesktop();
}
function renderDesktop() {
  document.documentElement.lang = S.lang === 'zh' ? 'zh-CN' : S.lang;
  document.title = u('title');
  const d = S.lv < 0 ? dayOf(0, -3) : dayOf(S.lv, 0);
  const clock = new Intl.DateTimeFormat(LOC[S.lang], { month: 'short', day: 'numeric', weekday: 'short' }).format(d) + ' 9:00';
  const returning = S.feed.length > 1 || S.done.size > 0;
  const pending = S.feed.filter(f => !f.read).length + unreadOf('grid');
  $('desktop').innerHTML = `
    <div class="menubar"><a class="home" href="../">← ${S.lang === 'en' ? 'Gratin Game' : 'グラタンゲーム'}</a><b>${esc(tr(COMPANY))}</b><span class="sp"></span><span class="clock">${esc(clock)}</span>
      <div class="langs" id="dlangs" role="group" aria-label="Language"><button data-l="zh" aria-pressed="${S.lang === 'zh'}">中</button><button data-l="en" aria-pressed="${S.lang === 'en'}">EN</button><button data-l="ja" aria-pressed="${S.lang === 'ja'}">日</button></div></div>
    <button class="notif" id="notif">${av('hr')}<div class="nh"><b>${esc(u('notifFrom'))}</b><span>${esc(u('notifNow'))}</span></div><p>${esc(u(returning ? 'notifBack' : 'notifNew'))}</p></button>
    <div class="deskmain">
      <button class="appicon" id="appicon"><div class="tile2">${ICON.grid}${pending ? `<i class="badge">${pending}</i>` : ''}</div><span>${esc(u('appName'))}</span></button>
      <div class="wordmark" aria-hidden="true">${esc(u('title'))}</div>
    </div>`;
  $('appicon').onclick = $('notif').onclick = launch;
  $('dlangs').onclick = e => { const b = e.target.closest('button'); if (!b) return; setLang(b.dataset.l); renderDesktop(); };
}
function launch() {
  if (S.open) return;
  S.open = true;
  const go = () => {
    $('desktop').hidden = true;
    const sc = $('screen');
    sc.hidden = false; sc.classList.remove('launch'); void sc.offsetWidth; sc.classList.add('launch');
    render(true);
    setTimeout(advance, 700);
  };
  if (reduceMotion()) { go(); return; }
  $('appicon').classList.add('opening');
  setTimeout(go, 380);
}
function save() { store.set('state', snapshot()); }
function setLang(l) {
  S.lang = l;
  saveLocale(l);
  loadFonts(l);
  save();
}

/* ---------- story progression ---------- */
const feedItem = key => S.feed.find(f => f.key === key);
const kindOf = key => key.split(':')[0];
const idOf = key => key.split(':')[1];
const APP_OF = { email: 'mail', chat: 'chat', talk: 'meet', finale: 'meet' };

function advance() {
  const b = S.done.size, beat = BEATS[b];
  if (!beat || !S.open || $('overlay').innerHTML) return;
  for (const key of beat) {
    const f = feedItem(key);
    if (!f) { deliver(key); return; }
    if (!f.read) return;
  }
  if (b < LEVELS.length && S.lv < b) {
    S.lv = b; save();
    toast('grid', u('newWeek'), u('weekOpen', { n: b + 1 }), () => openApp('grid'));
    render();
  }
}
function deliver(key) {
  S.feed.push({ key, read: false }); save();
  const k = kindOf(key), id = idOf(key);
  if (k === 'email') toast('mail', u('newMail'), `${nm(EMAILS[id].from)}: ${tr(EMAILS[id].subject)}`, () => openItem(key));
  if (k === 'chat') toast('chat', u('newChat'), tr(CHATS[id].name), () => openItem(key));
  if (k === 'talk') toast('meet', u('newMeet'), u('meeting', { n: nm(id) }), () => openItem(key));
  if (k === 'finale') toast('meet', u('newMeet'), u('allhands'), () => openItem(key));
  render();
}
function markRead(key) {
  const f = feedItem(key);
  if (!f || f.read) return;
  f.read = true; save();
  setTimeout(advance, 900);
}
function openApp(a) {
  S.view.app = a;
  if (a === 'grid' && S.lv >= 0 && !S.done.has(S.lv)) { S.gridSeen[S.lv] = true; S.view.week = S.lv; }
  closePop(); save(); render(true);
}
function openItem(key) {
  const k = kindOf(key);
  S.view.app = APP_OF[k];
  if (k === 'email') S.view.mail = key;
  if (k === 'chat') S.view.chat = key;
  if (k === 'talk' || k === 'finale') S.view.meet = key;
  S.tk = null; closePop(); save(); render(true);
}
function unreadOf(app) {
  if (app === 'grid') return S.lv >= 0 && !S.done.has(S.lv) && !S.gridSeen[S.lv] ? 1 : 0;
  return S.feed.filter(f => !f.read && APP_OF[kindOf(f.key)] === app).length;
}
function toast(app, title, text, onClick) {
  const el = document.createElement('button');
  el.className = 'toast';
  el.style.setProperty('--acc', `var(--${app === 'meet' ? 'mail' : app})`);
  el.innerHTML = `<div class="ti">${ICON[app]}</div><div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
  el.onclick = () => { el.remove(); onClick(); };
  $('toasts').innerHTML = '';
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

/* ---------- shell ---------- */
function render(fresh) {
  clearTimeout(S.timer); S.timer = null;
  document.documentElement.lang = S.lang === 'zh' ? 'zh-CN' : S.lang;
  document.title = u('title');
  $('brand').innerHTML = `${esc(u('title'))}<small>${esc(tr(COMPANY))}</small>`;
  $('langs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === S.lang));
  const cur = S.view.app;
  $('rail').innerHTML = ['grid', 'mail', 'chat', 'meet'].map(a => {
    const n = unreadOf(a);
    return `<button class="appi ${a === cur ? 'on' : ''}" data-app="${a}" style="--acc:var(--${a === 'meet' ? 'mail' : a})" aria-label="${esc(tr(UI.apps[a]))}${n ? ` (${n})` : ''}">${ICON[a]}<span>${esc(tr(UI.apps[a]))}</span>${n ? `<i class="badge">${a === 'grid' ? '!' : n}</i>` : ''}</button>`;
  }).join('');
  renderChapters();
  if (fresh) window.scrollTo({ top: 0 });
  ({ grid: renderGrid, mail: renderMail, chat: renderChat, meet: renderMeet, end: renderEnd })[cur]();
  if (cur === 'grid') maybeTutorial();
}
function renderChapters() {
  const opts = LEVELS.map((L, n) => `<option value="${n}">${esc(u('week', { n: n + 1 }))} · ${esc(tr(L.title))}${S.done.has(n) ? ' ✓' : ''}</option>`);
  opts.push(`<option value="10">${esc(u('ending'))}</option>`);
  $('chapter').innerHTML = opts.join('');
  $('chapter').value = String(S.ended || S.done.size >= 10 ? 10 : Math.max(0, S.lv));
}
function jumpTo(n) {
  const tut = S.tut;
  Object.assign(S, freshState(S.lang), { tut });
  S.done = new Set();
  for (let i = 0; i < n && i < LEVELS.length; i++) { S.done.add(i); S.grids[i] = solve(LEVELS[i], 1)[0]; }
  S.feed = BEATS.slice(0, n + 1).flat().map(key => ({ key, read: true }));
  if (n >= 10) {
    feedItem('finale').read = false;
    S.lv = 9; S.view = { app: 'meet', meet: 'finale', mail: null, chat: null, week: 9 };
  } else {
    S.lv = n; S.gridSeen[n] = true; S.view = { app: 'grid', week: n, mail: null, chat: null, meet: null };
  }
  S.tk = null; S.hist = []; S.anim = null; S.flashed = false;
  $('overlay').innerHTML = ''; $('toasts').innerHTML = ''; $('tut').innerHTML = ''; closePop();
  save(); render(true);
}

/* ---------- rule text ---------- */
function dayList(days) {
  if (days.length === 5) return { zh: '每天', en: 'Every day', ja: '毎日' }[S.lang];
  const ds = days.map(d => DAY[S.lang][d]);
  return S.lang === 'zh' ? ds.join('、') : S.lang === 'ja' ? ds.join('・') + '曜' : ds.join(', ');
}
function ruleText(c, lv) {
  const D = dayList(c.days || [c.d]);
  const B = c.b !== undefined ? nm(lv.people[c.b].id) : '';
  const n = c.n, L = S.lang;
  switch (c.t) {
    case 'quotaAll': {
      const exc = lv.people.filter(p => p.quota && p.quota !== lv.quota);
      const base = { zh: `每人每周出社 ${lv.quota} 天`, en: `Everyone in the office ${lv.quota} day${lv.quota > 1 ? 's' : ''} a week`, ja: `全員 週${lv.quota}日出社` }[L];
      if (!exc.length) return base;
      const ex = exc.map(p => nm(p.id)).join(L === 'en' ? ', ' : '、');
      return base + { zh: `（${ex} 特例 ${exc[0].quota} 天）`, en: ` (${ex}: ${exc[0].quota})`, ja: `（${ex}は特例で${exc[0].quota}日）` }[L];
    }
    case 'quota': return { zh: `本周出社 ${n} 天`, en: `${n} office day${n > 1 ? 's' : ''} this week`, ja: `今週は${n}日出社` }[L];
    case 'cap': return { zh: `${D} 最多 ${n} 人`, en: `${D}: ${n} ${n === 1 ? 'person' : 'people'} max`, ja: `${D}は最大${n}人` }[L];
    case 'min': return n >= lv.people.length ? { zh: `${D} 全员出社`, en: `${D}: everyone in`, ja: `${D}は全員出社` }[L] : { zh: `${D} 至少 ${n} 人`, en: `${D}: at least ${n} people`, ja: `${D}は${n}人以上` }[L];
    case 'fixed': return c.v ? { zh: `${D} 必须出社`, en: `In the office on ${D}`, ja: `${D}は出社` }[L] : { zh: `${D} 在宅`, en: `Remote on ${D}`, ja: `${D}は在宅` }[L];
    case 'lock': return { zh: `不想来：${D}`, en: `Won't come in: ${D}`, ja: `行きたくない：${D}` }[L];
    case 'with': return { zh: `只在${B}出社的日子来`, en: `Only comes in on days ${B} does`, ja: `${B}がいる日だけ出社` }[L];
    case 'apart': return { zh: `不和${B}同一天出社`, en: `Never on the same day as ${B}`, ja: `${B}と同じ日は出社しない` }[L];
    case 'overlap': return { zh: `和${B}恰好 ${n} 天同时出社`, en: `Exactly ${n} day${n > 1 ? 's' : ''} in together with ${B}`, ja: `${B}と同じ日はちょうど${n}日` }[L];
    case 'consec': return { zh: '出社日必须连在一起', en: 'Office days back-to-back', ja: '出社日は連続させる' }[L];
    case 'noconsec': return { zh: '不能连续两天出社', en: 'Never two office days in a row', ja: '2日連続の出社はNG' }[L];
  }
  return c.t;
}

/* ---------- level logic ---------- */
function gridOf(n) {
  const lv = LEVELS[n];
  let g = S.grids[n];
  if (!g || g.length !== lv.people.length) g = S.grids[n] = lv.people.map(() => Array(5).fill(null));
  lv.people.forEach((p, i) => (p.locks || []).forEach(d => { g[i][d] = 0; }));
  return g;
}
const lockedAt = (lv, p, d) => (lv.people[p].locks || []).includes(d);
function personRules(lv, i) {
  const p = lv.people[i], out = [{ c: { t: 'quota', p: i, n: p.quota ?? lv.quota } }];
  if (p.locks?.length) out.push({ c: { t: 'lock', p: i, days: p.locks }, fixed: true });
  p.rules.forEach(c => out.push({ c: resolve(lv, { ...(c.b !== undefined ? { a: p.id } : { p: p.id }), ...c }), why: c.why }));
  return out;
}
function cards(lv) {
  const out = [{ head: `<b>HQ</b><span>${esc(u('hq'))}</span>`, items: [{ c: { t: 'quotaAll' } }] }];
  if (lv.rules.length) out.push({ head: `<b>${esc(u('office'))}</b><span>${esc(u('ga'))}</span>`, items: lv.rules.map(c => ({ c: resolve(lv, c), why: c.why })) });
  lv.people.forEach((p, i) => {
    const items = personRules(lv, i).slice(1);
    if (items.length) out.push({ head: `${av(p.id)}<b>${esc(nm(p.id))}</b><span>${esc(tr(CAST[p.id].role))}</span>`, items });
  });
  return out;
}
function statusOf(c, g, lv) {
  if (c.t === 'quotaAll') {
    const rs = lv.people.map((p, i) => evalC({ t: 'quota', p: i, n: p.quota ?? lv.quota }, g));
    return rs.includes('bad') ? 'bad' : rs.every(r => r === 'ok') ? 'ok' : 'pending';
  }
  return evalC(c, g);
}
function rowStatus(lv, g, i) {
  const gv = settled(lv, g);
  const rs = personRules(lv, i).filter(it => !it.fixed).map(it => evalC(it.c, gv));
  return rs.includes('bad') ? 'bad' : rs.every(r => r === 'ok') ? 'ok' : '';
}
function cellsOf(c, lv) {
  const P = lv.people.length, out = [];
  const row = p => { for (let d = 0; d < 5; d++) out.push([p, d]); };
  const col = d => { for (let p = 0; p < P; p++) out.push([p, d]); };
  switch (c.t) {
    case 'quotaAll': for (let p = 0; p < P; p++) row(p); break;
    case 'fixed': out.push([c.p, c.d]); break;
    case 'lock': c.days.forEach(d => out.push([c.p, d])); break;
    case 'cap': case 'min': (c.days || [c.d]).forEach(col); break;
    case 'with': case 'apart': case 'overlap': row(c.a); row(c.b); break;
    default: row(c.p);
  }
  return out;
}
const asHome = g => g.map(r => r.map(v => v ?? 0));
const solvedNow = (lv, g) => allConstraints(lv).every(c => evalC(c, asHome(g)) === 'ok');
const settled = (lv, g) => g.map((r, i) => r.filter(v => v === 1).length >= (lv.people[i].quota ?? lv.quota) ? r.map(x => x ?? 0) : r);
function dayOf(n, i) { const d = new Date(2026, 9, 12 + 7 * n); d.setDate(d.getDate() + i); return d; }
const weekDates = n => [0, 1, 2, 3, 4].map(i => new Intl.DateTimeFormat(LOC[S.lang], { month: 'numeric', day: 'numeric' }).format(dayOf(n, i)));
const ruleRow = (it, st, lv, attrs = '', who) => `<div class="rule ${it.fixed ? 'fixedr' : st}" ${attrs}><span class="dot"></span><span class="tx">${who ? `<b>${esc(nm(who))}</b> · ` : ''}${esc(ruleText(it.c, lv))}</span>${it.why ? `<span class="why">${esc(tr(it.why))}</span>` : ''}</div>`;

/* ---------- WeekGrid ---------- */
function renderGrid() {
  const app = $('app');
  app.className = 'app wg';
  const maxWeek = Math.max(S.lv, S.done.size - 1);
  if (maxWeek < 0) {
    app.innerHTML = `<div class="wg-head"><div class="wg-logo">${ICON.grid}WeekGrid</div></div><div class="empty">${ICON.grid}<b>${esc(u('noWeek'))}</b><span>${esc(u('noWeekHint'))}</span></div>`;
    return;
  }
  let n = S.view.week;
  if (n == null || n > maxWeek || n < 0) n = S.view.week = maxWeek;
  const lv = LEVELS[n], g = gridOf(n), P = lv.people.length;
  const editable = n === S.lv && !S.done.has(n);
  if (!lv._sol) lv._sol = solve(lv, 1)[0];
  const dates = weekDates(n);
  const on = g.flat().filter(v => v === 1).length;
  const need = lv.people.reduce((s, p) => s + (p.quota ?? lv.quota), 0);
  const pct = Math.round(on / (P * 5) * 100), tgt = Math.round(need / (P * 5) * 100);

  const caps = Array.from({ length: 5 }, () => ({ lo: 0, hi: P, rules: [] }));
  lv.rules.forEach(c => (c.days || [c.d]).forEach(d => {
    if (c.t === 'cap') caps[d].hi = Math.min(caps[d].hi, c.n);
    if (c.t === 'min') caps[d].lo = Math.max(caps[d].lo, c.n);
    caps[d].rules.push(c);
  }));

  let h = `<div class="hd c0"></div>` + dates.map((dt, d) => { const k = dayItems(lv, d).filter(it => !it.fixed).length; return `<button class="hd day ${k ? 'sp' : ''}" data-day="${d}"><b>${DAY[S.lang][d]}</b>${dt}${k ? `<i class="dn2">${k}</i>` : ''}</button>`; }).join('');
  lv.people.forEach((p, i) => {
    const q = p.quota ?? lv.quota, cnt = g[i].filter(v => v === 1).length;
    const qs = evalC({ t: 'quota', p: i, n: q }, settled(lv, g)), rs = rowStatus(lv, g, i);
    h += `<button class="who c0" data-who="${i}" style="--h:${CAST[p.id].hue}">${av(p.id)}<div class="meta"><div class="nm">${esc(nm(p.id))}</div><div class="rl"><span class="qty ${qs}">${cnt}/${q}</span><span class="role">${esc(tr(CAST[p.id].role))}</span></div></div>${rs ? `<span class="mark ${rs}">${rs === 'ok' ? '✓' : '✕'}</span>` : ''}</button>`;
    for (let d = 0; d < 5; d++) {
      const v = g[i][d], lk = lockedAt(lv, i, d);
      const cls = (v === 1 ? 'on' : v === 0 ? 'off' : '') + (lk ? ' fixed' : '') + (editable ? '' : ' ro');
      const inner = v === 1 ? `${ICON.on}<span class="tx">${esc(u('office_tx'))}</span>` : v === 0 ? `${ICON.off}<span class="tx">${esc(u('home_tx'))}</span>${lk ? `<span class="req">${esc(u('reqTag'))}</span>` : ''}` : '';
      const lab = `${nm(p.id)} ${DAY[S.lang][d]}: ${v === 1 ? u('office_tx') : v === 0 ? u('home_tx') : '—'}${lk ? ' · ' + u('reqLong') : ''}`;
      h += `<div class="slot"><button class="cell ${cls}" style="--h:${CAST[p.id].hue}" data-p="${i}" data-d="${d}" aria-label="${esc(lab)}" ${lk || !editable ? 'aria-disabled="true"' : ''} ${lk ? `title="${esc(u('reqLong'))}"` : ''}>${inner}</button></div>`;
    }
  });
  h += `<div class="ft c0"></div>`;
  for (let d = 0; d < 5; d++) {
    const cnt = g.filter(r => r[d] === 1).length, { lo, hi, rules } = caps[d];
    const st = rules.length ? rules.map(c => evalC({ ...c, days: undefined, d }, settled(lv, g))).reduce((a, b) => a === 'bad' || b === 'bad' ? 'bad' : a === 'ok' && b === 'ok' ? 'ok' : 'pending') : '';
    const lim = lo && hi < P ? `${lo}–${hi}` : lo ? `≥${lo}` : hi < P ? `≤${hi}` : '';
    h += `<div class="ft ${st}" data-col="${d}">${cnt}${esc(u('people'))}${lim ? `<span class="lim">${lim}</span>` : ''}</div>`;
  }

  const groups = cards(lv);
  let total = 0, ok = 0, r = '';
  groups.forEach((gr, gi) => {
    r += `<div class="rq"><div class="rh">${gr.head}</div>`;
    gr.items.forEach((it, ii) => {
      const st = it.fixed ? '' : statusOf(it.c, settled(lv, g), lv);
      if (!it.fixed) { total++; if (st === 'ok') ok++; }
      r += ruleRow(it, st, lv, `tabindex="0" data-g="${gi}" data-i="${ii}"`);
    });
    r += `</div>`;
  });
  S.groups = groups;
  const solved = editable && solvedNow(lv, g);
  const waiting = !editable && n === maxWeek && S.done.size < LEVELS.length;

  app.innerHTML = `
    <div class="wg-head">
      <div class="wg-logo">${ICON.grid}WeekGrid</div>
      <div class="weeknav"><button id="prevw" aria-label="‹" ${n === 0 ? 'disabled' : ''}>‹</button><span>${esc(u('team'))} / <b>${esc(u('week', { n: n + 1 }))} · ${esc(tr(lv.title))}</b></span><button id="nextw" aria-label="›" ${n >= maxWeek ? 'disabled' : ''}>›</button></div>
      <div class="kpi" id="kpi"><div class="lab"><span>${esc(u('attend'))}</span><span><b>${pct}%</b> / ${esc(u('target'))} ${tgt}%</span></div><div class="bar"><i style="width:${pct}%"></i><u style="left:${tgt}%"></u></div></div>
    </div>
    <div class="intro ${editable ? '' : 'past'}">${esc(waiting ? u('waitNext') : tr(lv.intro))}</div>
    <div class="wg-body">
      <section class="sched">
        <div class="g" id="grid">${h}</div>
        <div class="tools">
          ${editable ? `<button class="btn" id="undo" ${S.hist.length ? '' : 'disabled'}>${esc(u('undo'))}</button>
          <button class="btn" id="clear">${esc(u('clear'))}</button>
          <button class="btn" id="hint">${esc(u('hint'))}</button>
          <span class="sp"></span>
          <button class="btn primary ${solved ? 'ready' : ''}" id="submit" ${solved ? '' : 'disabled'}>${esc(u('submit'))}</button>` : `<span class="sp"></span><span class="subbed">${esc(u('submitted'))}</span>`}
        </div>
      </section>
      <aside class="reqs" id="reqs"><h3><span>${esc(u('requests'))}</span><span><b>${ok}/${total}</b> ${esc(u('met'))}</span></h3>${r}</aside>
    </div>`;
  bindGrid(n, lv, editable);
}

function setCell(n, p, d, v) {
  const lv = LEVELS[n], g = gridOf(n);
  if (lockedAt(lv, p, d) || g[p][d] === v) return;
  S.hist.push(JSON.stringify(g));
  g[p][d] = v; save(); render();
}
function bindGrid(n, lv, editable) {
  const grid = $('grid');
  $('prevw').onclick = () => { S.view.week = n - 1; S.hist = []; closePop(); save(); render(); };
  $('nextw').onclick = () => { S.view.week = n + 1; S.hist = []; closePop(); save(); render(); };
  let press = null;
  grid.onclick = e => {
    const w = e.target.closest('.who, .day');
    if (w) { if (S.touch) togglePop(w, n, true); return; }
    const b = e.target.closest('.cell'); if (!b || !editable) return;
    if (press?.fired) { press = null; return; }
    const p = +b.dataset.p, d = +b.dataset.d, v = gridOf(n)[p][d];
    setCell(n, p, d, v === null ? 1 : v === 1 ? 0 : null);
  };
  grid.oncontextmenu = e => {
    const b = e.target.closest('.cell'); if (!b || !editable) return;
    e.preventDefault();
    const p = +b.dataset.p, d = +b.dataset.d;
    setCell(n, p, d, gridOf(n)[p][d] === 0 ? null : 0);
  };
  grid.onpointerdown = e => {
    S.touch = e.pointerType !== 'mouse';
    const b = e.target.closest('.cell'); if (!b || !editable || e.pointerType === 'mouse') return;
    press = { fired: false };
    press.t = setTimeout(() => { press.fired = true; const p = +b.dataset.p, d = +b.dataset.d; setCell(n, p, d, gridOf(n)[p][d] === 0 ? null : 0); }, 450);
  };
  grid.onpointerup = grid.onpointercancel = () => { if (press && !press.fired) { clearTimeout(press.t); press = null; } };
  grid.onpointerover = e => { if (e.pointerType !== 'mouse') return; const w = e.target.closest('.who, .day'); if (w) showPop(w, n, false); };
  grid.onpointerout = e => { if (e.pointerType !== 'mouse') return; const w = e.target.closest('.who, .day'); if (w && !w.contains(e.relatedTarget)) closePop(); };
  if (editable) {
    $('undo').onclick = () => { if (!S.hist.length) return; S.grids[n] = JSON.parse(S.hist.pop()); save(); render(); };
    $('clear').onclick = () => { S.hist.push(JSON.stringify(gridOf(n))); S.grids[n] = null; gridOf(n); save(); render(); };
    $('hint').onclick = () => hint(n, lv);
    $('submit').onclick = () => submit(n);
  }
  const reqs = $('reqs');
  const focus = el => {
    document.querySelectorAll('.focus').forEach(e => e.classList.remove('focus'));
    if (!el) return;
    const it = S.groups[+el.dataset.g].items[+el.dataset.i];
    cellsOf(it.c, lv).forEach(([p, d]) => document.querySelector(`.cell[data-p="${p}"][data-d="${d}"]`)?.classList.add('focus'));
    if (it.c.t === 'cap' || it.c.t === 'min') (it.c.days || [it.c.d]).forEach(d => document.querySelector(`.ft[data-col="${d}"]`)?.classList.add('focus'));
  };
  reqs.onmouseover = e => focus(e.target.closest('.rule'));
  reqs.onmouseout = () => focus(null);
  reqs.onfocusin = e => focus(e.target.closest('.rule'));
  reqs.onfocusout = () => focus(null);
}

function dayItems(lv, d) {
  const out = [];
  lv.rules.forEach(c => { if ((c.days || [c.d]).includes(d)) out.push({ c: { ...resolve(lv, c), days: undefined, d }, why: c.why }); });
  lv.people.forEach((p, i) => {
    if ((p.locks || []).includes(d)) out.push({ c: { t: 'lock', p: i, days: [d] }, fixed: true, who: p.id });
    p.rules.forEach(c => { if (c.t === 'fixed' && c.d === d) out.push({ c: resolve(lv, { p: p.id, ...c }), why: c.why, who: p.id }); });
  });
  return out;
}
function showPop(anchor, n, touch) {
  const lv = LEVELS[n], gv = settled(lv, gridOf(n));
  const key = anchor.dataset.who != null ? 'p' + anchor.dataset.who : 'd' + anchor.dataset.day;
  let body;
  if (key[0] === 'p') {
    const i = +anchor.dataset.who, p = lv.people[i];
    body = `<div class="ph">${av(p.id)}<div><b>${esc(nm(p.id))}</b><span>${esc(tr(CAST[p.id].role))}</span></div></div>${personRules(lv, i).map(it => ruleRow(it, it.fixed ? '' : evalC(it.c, gv), lv)).join('')}`;
  } else {
    const d = +anchor.dataset.day, items = dayItems(lv, d);
    const cnt = gv.filter(r => r[d] === 1).length;
    body = `<div class="ph"><div><b>${esc(DAY[S.lang][d])} · ${esc(weekDates(n)[d])}</b><span>${esc(u('office_tx'))} ${cnt}${esc(u('people'))}</span></div></div>${items.length ? items.map(it => ruleRow(it, it.fixed ? '' : evalC(it.c, gv), lv, '', it.who)).join('') : `<div class="rule"><span></span><span class="tx" style="color:var(--ink-3)">${esc(u('noDayReq'))}</span></div>`}`;
  }
  $('pop').innerHTML = `<div class="pop ${touch ? 'touch' : ''}" id="popbox" data-k="${key}">${body}</div>`;
  const box = $('popbox'), r = anchor.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
  let left = r.right + 8, top = r.top;
  if (key[0] === 'd' || left + w > innerWidth - 12) { left = Math.max(12, Math.min(r.left, innerWidth - w - 12)); top = r.bottom + 6; }
  if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 6);
  box.style.left = left + 'px'; box.style.top = top + 'px';
}
function togglePop(anchor, n) {
  const open = $('popbox'), key = anchor.dataset.who != null ? 'p' + anchor.dataset.who : 'd' + anchor.dataset.day;
  if (open && open.dataset.k === key) { closePop(); return; }
  showPop(anchor, n, true);
}
function closePop() { $('pop').innerHTML = ''; }

function hint(n, lv) {
  const g = gridOf(n), sol = lv._sol;
  document.querySelectorAll('.cell.hint,.cell.wrong').forEach(e => e.classList.remove('hint', 'wrong'));
  for (let p = 0; p < g.length; p++) for (let d = 0; d < 5; d++) {
    if (g[p][d] !== null && g[p][d] !== sol[p][d]) { document.querySelector(`.cell[data-p="${p}"][data-d="${d}"]`).classList.add('wrong'); return; }
  }
  const empty = [];
  for (let p = 0; p < g.length; p++) for (let d = 0; d < 5; d++) if (g[p][d] === null) empty.push([p, d]);
  if (!empty.length) return;
  const cs = allConstraints(lv);
  const forced = empty.filter(([p, d]) => { const t = g.map(r => r.slice()); t[p][d] = 1 - sol[p][d]; return cs.some(c => evalC(c, t) === 'bad'); });
  const [p, d] = (forced.length ? forced : empty)[0];
  setCell(n, p, d, sol[p][d]);
  document.querySelector(`.cell[data-p="${p}"][data-d="${d}"]`)?.classList.add('hint');
}

function submit(n) {
  S.grids[n] = asHome(gridOf(n));
  S.done.add(n); S.hist = []; closePop(); save();
  const ov = $('overlay');
  const finish = () => { ov.innerHTML = ''; render(); setTimeout(advance, 300); };
  if (reduceMotion()) { render(); finish(); return; }
  ov.innerHTML = `<div class="ov"><div class="stamp">${esc(u('submitted'))}</div></div>`;
  render();
  setTimeout(() => weekFlip(n, finish), 900);
}
function weekFlip(n, done) {
  const ov = $('overlay');
  const frames = [0, 1, 2, 3, 4, 7].map(i => { const d = dayOf(n, i); return { dn: d.getDate(), dd: new Intl.DateTimeFormat(LOC[S.lang], { month: 'short', weekday: 'short' }).format(d) }; });
  ov.innerHTML = `<div class="ov"><div class="cal"><div class="calpad"><div class="ring"><i></i><i></i><i></i><i></i></div><div class="page" id="calpage"></div></div><div class="cap" id="calcap">${esc(u('weekOf', { n: n + 1 }))}</div></div></div>`;
  let k = 0;
  const step = () => {
    const pg = $('calpage'); if (!pg) return;
    const f = frames[k];
    pg.classList.remove('flip'); void pg.offsetWidth; pg.classList.add('flip');
    pg.innerHTML = `<div class="dn">${f.dn}</div><div class="dd">${esc(f.dd)}</div>`;
    k++;
    if (k < frames.length) setTimeout(step, k === frames.length - 1 ? 480 : 280);
    else {
      if (n + 1 < LEVELS.length) $('calcap').textContent = u('week', { n: n + 2 });
      setTimeout(done, 1000);
    }
  };
  step();
}

/* ---------- tutorial ---------- */
function maybeTutorial() {
  if (S.tut || S.lv !== 0 || S.done.has(0) || S.view.week !== 0 || $('tut').innerHTML) return;
  S.tutStep = 0;
  setTimeout(showTut, 350);
}
function showTut() {
  if (S.view.app !== 'grid') { $('tut').innerHTML = ''; return; }
  const targets = [
    () => document.querySelector('.cell[data-p="0"][data-d="1"]'),
    () => document.querySelector('.who[data-who="0"]'),
    () => $('reqs'),
    () => $('kpi'),
    () => $('submit'),
  ];
  const i = S.tutStep, el = targets[i]?.();
  if (!el) { endTut(); return; }
  el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
  setTimeout(() => {
    const r = el.getBoundingClientRect(), pad = 6, last = i === targets.length - 1;
    const sh = Math.min(r.height + pad * 2, innerHeight * .6);
    $('tut').innerHTML = `<div class="tut-block"></div><div class="tut-spot" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${sh}px"></div>
      <div class="tut-tip" id="tuttip" role="dialog"><p>${esc(tr(UI.tut[i]))}</p><div class="row"><span>${i + 1} / ${targets.length}</span><div style="display:flex;gap:6px">${last ? '' : `<button class="btn" id="tutskip">${esc(u('skipTut'))}</button>`}<button class="btn primary" id="tutnext">${esc(last ? u('done') : u('next'))}</button></div></div></div>`;
    const tip = $('tuttip'), tw = tip.offsetWidth, th = tip.offsetHeight;
    let top = r.top - pad + sh + 12, left = Math.min(Math.max(12, r.left), innerWidth - tw - 12);
    if (top + th > innerHeight - 12) top = Math.max(12, r.top - th - 14);
    if (r.right + tw + 20 < innerWidth && top + th > innerHeight - 12) { left = r.right + 16; top = Math.max(12, r.top); }
    tip.style.top = top + 'px'; tip.style.left = left + 'px';
    $('tutnext').onclick = () => { if (last) endTut(); else { S.tutStep++; showTut(); } };
    $('tutnext').focus({ preventScroll: true });
    if ($('tutskip')) $('tutskip').onclick = endTut;
  }, reduceMotion() ? 0 : 350);
}
function endTut() { S.tut = true; save(); $('tut').innerHTML = ''; }

/* ---------- Mail ---------- */
const shortDate = s => S.lang === 'en' ? s.split(', ')[1].split(' ·')[0] : s.split(' ')[0];
function renderMail() {
  const app = $('app');
  app.className = 'app mail';
  const mails = S.feed.filter(f => kindOf(f.key) === 'email').slice().reverse();
  if (!mails.length) { app.innerHTML = `<div class="empty">${ICON.mail}<b>${esc(u('emptyMail'))}</b><span>${esc(u('emptyHint'))}</span></div>`; return; }
  let cur = S.view.mail;
  if (!cur || !feedItem(cur)) cur = S.view.mail = (mails.find(f => !f.read) || mails[0]).key;
  const m = EMAILS[idOf(cur)];
  const list = mails.map(f => { const e = EMAILS[idOf(f.key)], un = !f.read && f.key !== cur; return `<button class="li ${f.key === cur ? 'cur' : ''} ${un ? 'unread' : ''}" data-k="${f.key}"><div class="f"><span class="nm2">${un ? '<i class="ud"></i>' : ''}${esc(nm(e.from))}</span><span class="dt2">${esc(shortDate(tr(e.date)))}</span></div><div class="s">${esc(tr(e.subject))}</div></button>`; }).join('');
  const table = m.table ? `<div class="tablewrap"><table class="mtable"><thead><tr>${m.table.head.map(x => `<th>${esc(tr(x))}</th>`).join('')}</tr></thead><tbody>${m.table.rows.map(r => `<tr class="${r[2] ? 'me' : ''}"><td>${esc(tr(r[0]))}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>` : '';
  const role = tr(CAST[m.from].role);
  app.innerHTML = `
    <div class="split">
      <div class="list"><div class="lh">${ICON.mail}${esc(u('inbox'))}</div>${list}</div>
      <article class="read">
        <h2>${esc(tr(m.subject))}</h2>
        <div class="meta-row">${av(m.from)}<div class="who2"><b>${esc(nm(m.from))}${role ? ` · ${esc(role)}` : ''}</b><span>${esc(u('to'))}: ${esc(tr(m.to))}</span></div><div class="dt">${esc(tr(m.date))}</div></div>
        ${m.body.slice(0, -1).map(p => `<p>${esc(tr(p))}</p>`).join('')}${table}<p>${esc(tr(m.body[m.body.length - 1]))}</p>
        <p style="color:var(--ink-3)">— ${esc(nm(m.from))}${role ? ` (${esc(role)})` : ''}, ${esc(tr(COMPANY))}</p>
      </article>
    </div>`;
  app.querySelectorAll('.li').forEach(b => b.onclick = () => { S.view.mail = b.dataset.k; save(); render(); });
  if (!feedItem(cur).read) { markRead(cur); $('rail').querySelector('[data-app="mail"] .badge')?.remove(); }
}

/* ---------- Chat ---------- */
function renderChat() {
  const app = $('app');
  app.className = 'app chat';
  const chats = S.feed.filter(f => kindOf(f.key) === 'chat').slice().reverse();
  if (!chats.length) { app.innerHTML = `<div class="empty">${ICON.chat}<b>${esc(u('emptyChat'))}</b><span>${esc(u('emptyHint'))}</span></div>`; return; }
  let cur = S.view.chat;
  if (!cur || !feedItem(cur)) cur = S.view.chat = (chats.find(f => !f.read) || chats[0]).key;
  const c = CHATS[idOf(cur)], fi = feedItem(cur);
  const people = new Set(c.msgs.map(m => m[0]));
  if (fi.read || reduceMotion()) S.anim = null;
  else if (!S.anim || S.anim.key !== cur) S.anim = { key: cur, n: 0 };
  const shownN = S.anim ? S.anim.n : c.msgs.length;
  const shown = c.msgs.slice(0, shownN);
  const list = chats.map(f => { const x = CHATS[idOf(f.key)], last = x.msgs[x.msgs.length - 1], un = !f.read && f.key !== cur; return `<button class="li ${f.key === cur ? 'cur' : ''} ${un ? 'unread' : ''}" data-k="${f.key}"><div class="f"><span class="nm2">${un ? '<i class="ud"></i>' : ''}${esc(tr(x.name))}</span></div><div class="s">${esc(nm(last[0]))}: ${esc(tr(last[1]))}</div></button>`; }).join('');
  app.innerHTML = `
    <div class="split">
      <div class="list"><div class="lh">${esc(tr(COMPANY))}</div><div class="sec">${esc(u('groups'))}</div>${list}</div>
      <div class="convo">
        <div class="chan-title"><b>${esc(tr(c.name))}</b><span>${c.channel} · ${esc(u('members', { n: people.size + 1 }))}</span></div>
        <div class="msgs" id="msgs">${shown.map(([who, tx], i) => `<div class="msg ${S.anim && i === shown.length - 1 ? 'new' : ''}">${av(who)}<div class="tx"><div class="who3">${esc(nm(who))}<span>${esc(tr(CAST[who].role))}</span></div>${esc(tr(tx))}</div></div>`).join('')}
        ${S.anim && shownN < c.msgs.length ? `<div class="typing"><i></i><i></i><i></i> ${esc(nm(c.msgs[shownN][0]))}</div>` : ''}</div>
      </div>
    </div>`;
  const box = $('msgs'); box.scrollTop = box.scrollHeight;
  app.querySelectorAll('.li').forEach(b => b.onclick = () => { S.view.chat = b.dataset.k; save(); render(); });
  if (S.anim) {
    if (S.anim.n >= c.msgs.length) { S.anim = null; markRead(cur); render(); }
    else S.timer = setTimeout(() => { if (S.anim) S.anim.n++; render(); }, S.anim.n === 0 ? 400 : 950);
  }
}

/* ---------- Meet ---------- */
function talkSeq(lines, pick) {
  const seq = [];
  for (const l of lines) {
    if (l.choice) { if (pick == null) { seq.push({ choice: l.choice }); break; } seq.push(['me', l.choice[pick].label], ...l.choice[pick].reply); }
    else seq.push(l);
  }
  return seq;
}
function renderMeet() {
  const app = $('app');
  app.className = 'app meet';
  const meets = S.feed.filter(f => ['talk', 'finale'].includes(kindOf(f.key)));
  if (!meets.length) { app.innerHTML = `<div class="empty">${ICON.meet}<b>${esc(u('emptyMeet'))}</b><span>${esc(u('emptyHint'))}</span></div>`; return; }
  const live = meets.filter(f => !f.read), recs = meets.filter(f => f.read).reverse();
  let cur = S.view.meet;
  if (!cur || !feedItem(cur)) cur = S.view.meet = (live[0] || recs[0]).key;
  const title = key => key === 'finale' ? u('allhands') : u('meeting', { n: nm(idOf(key)) });
  const item = (f, isLive) => `<button class="li ${f.key === cur ? 'cur' : ''} ${isLive ? 'unread' : ''}" data-k="${f.key}"><div class="f"><span class="nm2">${esc(title(f.key))}</span>${isLive ? '<span class="livetag">LIVE</span>' : ''}</div><div class="s">${esc(isLive ? (f.key === 'finale' ? tr(COMPANY) : u('waiting', { n: nm(idOf(f.key)) })) : u('replay'))}</div></button>`;
  const list = `<div class="lh">${ICON.meet}${esc(tr(UI.apps.meet))}</div>${live.length ? `<div class="sec">${esc(u('live'))}</div>${live.map(f => item(f, true)).join('')}` : ''}${recs.length ? `<div class="sec">${esc(u('recordings'))}</div>${recs.map(f => item(f, false)).join('')}` : ''}`;
  const isLive = !feedItem(cur).read;
  const stage = cur === 'finale' ? finaleStage(isLive) : talkStage(idOf(cur), cur, isLive);
  app.innerHTML = `<div class="split"><div class="list">${list}</div><div class="stage" id="stage">${stage}</div></div>`;
  app.querySelectorAll('.li').forEach(b => b.onclick = () => { S.view.meet = b.dataset.k; S.tk = null; save(); render(); });
  const t = $('tsc'); if (t) t.scrollTop = t.scrollHeight;
  bindStage(cur, isLive);
}
const lineHtml = (w, t, other, isNew, named) => `<div class="line ${w === 'me' ? 'me' : ''} ${isNew ? 'new' : ''}">${av(w === 'me' ? 'me' : (other || w))}<div class="bub">${named ? `<b>${esc(nm(w))}</b> ` : ''}${esc(tr(t))}</div></div>`;
function unlockHtml(who) {
  const tk = TALKS[who];
  return `<div class="unlock" role="status"><h4>${esc(u('unlocked'))}</h4><div class="from">${esc(nm(who))}: ${esc(tr(tk.unlock.before))}</div><div class="to">${esc(nm(who))}: ${esc(tr(tk.unlock.after))}</div></div>`;
}
function talkStage(who, key, isLive) {
  const tk = TALKS[who];
  const tiles = (sp, mood) => `<div class="tiles">${tile(who, { speak: sp === 'them', listen: sp === 'me', mood })}${tile('me', { speak: sp === 'me' })}</div>`;
  if (!isLive) {
    const seq = talkSeq(tk.lines, S.picks[who] ?? 0);
    return `<div class="meet-top"><span class="rec pb"></span><b>${esc(u('meeting', { n: nm(who) }))}</b><span class="tm">${esc(u('replay'))}</span></div>
      ${tiles('')}
      <div class="transcript" id="tsc">${seq.map(([w, t]) => lineHtml(w, t, who)).join('')}</div>
      ${unlockHtml(who)}`;
  }
  if (!S.tk || S.tk.key !== key) S.tk = { key, pos: 0, pick: null, end: false };
  const seq = talkSeq(tk.lines, S.tk.pick);
  const shown = seq.slice(0, S.tk.pos + 1).filter(l => !l.choice);
  const atChoice = seq[S.tk.pos]?.choice;
  const last = S.tk.pos >= seq.length - 1 && !atChoice;
  const speaker = shown.length ? shown[shown.length - 1][0] : 'them';
  const mood = shown.length ? moodOf(shown[shown.length - 1][1]) : '';
  const mm = 2 + S.tk.pos, ss = (17 + S.tk.pos * 23) % 60;
  return `<div class="meet-top"><span class="rec"></span><b>${esc(u('meeting', { n: nm(who) }))}</b><span class="tm">${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}</span></div>
    ${tiles(speaker, mood)}
    <div class="transcript" id="tsc">${shown.map(([w, t], i) => lineHtml(w, t, who, i === shown.length - 1)).join('')}</div>
    ${atChoice ? `<div class="choices">${atChoice.map((c, i) => `<button data-i="${i}"><span class="tag">${esc(u(i ? 'choiceB' : 'choiceA'))}</span>${esc(tr(c.label))}</button>`).join('')}</div>` : ''}
    ${S.tk.end ? unlockHtml(who) : ''}
    <div class="next-row">${atChoice ? '' : S.tk.end ? `<button class="btn primary" id="leave">${esc(u('leave'))}</button>` : `<button class="btn primary" id="adv">${esc(last ? u('endcall') : u('cont'))}</button>`}</div>`;
}
function finaleStage(isLive) {
  const crowd = ['mori', 'kuroda', ...ORDER, 'me'];
  const tiles = (sp, mood) => `<div class="tiles many">${crowd.map(id => tile(id, { speak: id === sp, mood, bgId: id === 'kuroda' || id === 'mori' ? id : 'me' })).join('')}</div>`;
  if (!isLive) {
    return `<div class="meet-top"><span class="rec pb"></span><b>${esc(u('allhands'))}</b><span class="tm">${esc(u('replay'))}</span></div>
      ${tiles('')}
      <div class="transcript" id="tsc">${FINALE.map(([w, t]) => lineHtml(w, t, null, false, true)).join('')}</div>
      <div class="next-row"><button class="btn primary" id="photo">${esc(u('viewPhoto'))}</button></div>`;
  }
  if (!S.tk || S.tk.key !== 'finale') S.tk = { key: 'finale', pos: 0 };
  const shown = FINALE.slice(0, S.tk.pos + 1), last = S.tk.pos >= FINALE.length - 1;
  return `<div class="meet-top"><span class="rec"></span><b>${esc(u('allhands'))}</b><span class="tm">${esc(tr(COMPANY))}</span></div>
    ${tiles(shown[shown.length - 1][0], moodOf(shown[shown.length - 1][1]))}
    <div class="transcript" id="tsc">${shown.map(([w, t], i) => lineHtml(w, t, null, i === shown.length - 1, true)).join('')}</div>
    <div class="next-row"><button class="btn primary" id="adv">${esc(last ? u('takePhoto') : u('cont'))}</button></div>`;
}
function bindStage(key, isLive) {
  $('stage').querySelectorAll('.choices button').forEach(b => b.onclick = () => { S.tk.pick = +b.dataset.i; render(); });
  if ($('photo')) $('photo').onclick = () => { S.view.app = 'end'; save(); render(true); };
  if (!isLive) return;
  if (key === 'finale') {
    $('adv').onclick = () => {
      if (S.tk.pos < FINALE.length - 1) { S.tk.pos++; render(); return; }
      feedItem('finale').read = true; S.ended = true; S.view.app = 'end'; S.flashed = false; S.tk = null; save(); render(true);
    };
    return;
  }
  const who = idOf(key), seq = talkSeq(TALKS[who].lines, S.tk.pick);
  if ($('adv')) $('adv').onclick = () => { if (S.tk.pos >= seq.length - 1) S.tk.end = true; else S.tk.pos++; render(); };
  if ($('leave')) $('leave').onclick = () => { S.picks[who] = S.tk.pick ?? 0; S.tk = null; markRead(key); render(); };
}

/* ---------- ending ---------- */
function renderEnd() {
  const app = $('app');
  app.className = 'app photo-app';
  const text = u('shareTx'), enc = encodeURIComponent;
  const links = [
    ['X', `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(SHARE_URL)}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(SHARE_URL)}`],
    ['LINE', `https://social-plugins.line.me/lineit/share?url=${enc(SHARE_URL)}&text=${enc(text)}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SHARE_URL)}`],
  ];
  app.innerHTML = `
    <div class="polaroid">
      <div class="pic"><img src="art/allhands.jpg" alt="${esc(u('caption'))}"></div>
      <div class="cap">${esc(u('caption'))}</div>
    </div>
    <div class="endtext"><h2>${esc(u('endTitle'))}</h2><p>${esc(u('endP'))}</p><p style="font-size:12.5px">${esc(u('photoBy'))}</p></div>
    <div class="share">${links.map(([n, href]) => `<a href="${href}" target="_blank" rel="noopener">${ICON.link}${n}</a>`).join('')}<button id="copy">${esc(u('copy'))}</button></div>
    <button class="btn" id="again">${esc(u('again'))}</button>`;
  if (!reduceMotion() && !S.flashed) {
    S.flashed = true;
    $('overlay').innerHTML = '<div class="flash"></div>';
    setTimeout(() => { $('overlay').innerHTML = ''; }, 800);
  }
  $('copy').onclick = async e => {
    const b = e.currentTarget, full = text + ' ' + SHARE_URL;
    try { await navigator.clipboard.writeText(full); b.textContent = u('copied'); b.classList.add('copied'); }
    catch { const sp = document.createElement('span'); sp.textContent = full; b.after(sp); const r = document.createRange(); r.selectNodeContents(sp); getSelection().removeAllRanges(); getSelection().addRange(r); }
  };
  $('again').onclick = () => {
    const tut = S.tut;
    Object.assign(S, freshState(S.lang), { tut });
    S.done = new Set(); S.flashed = false; S.tk = null; S.anim = null;
    $('overlay').innerHTML = ''; save(); showDesktop();
  };
}

function bindGlobal() {
  $('langs').onclick = e => { const b = e.target.closest('button'); if (!b) return; setLang(b.dataset.l); closePop(); render(); if ($('tut').innerHTML) showTut(); };
  $('chapter').onchange = e => jumpTo(+e.target.value);
  $('brand').onclick = () => { closePop(); $('tut').innerHTML = ''; $('toasts').innerHTML = ''; showDesktop(); };
  $('rail').onclick = e => { const b = e.target.closest('.appi'); if (b) openApp(b.dataset.app); };
  document.addEventListener('pointerdown', e => { if ($('popbox')?.classList.contains('touch') && !e.target.closest('.pop') && !e.target.closest('.who, .day')) closePop(); });
  addEventListener('scroll', () => { if ($('popbox') && !$('popbox').classList.contains('touch')) closePop(); }, { passive: true });
  addEventListener('resize', () => { if ($('tut').innerHTML) showTut(); });
}

function syncLang() {
  const l = loadLocale();
  if (l === S.lang) return;
  S.lang = l;
  loadFonts(l);
  if (S.open) { closePop(); render(); } else renderDesktop();
}
addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncLang(); });
addEventListener('pageshow', e => { if (e.persisted) syncLang(); });

start({});

if (import.meta.env.DEV) {
  Object.assign(window, { rto: { get S() { return S; }, freshState, render, advance, openItem, openApp, jumpTo, launch, gridOf, asHome, feedItem, kindOf, idOf, showPop, closePop, solve, LEVELS, CHATS } });
}

if (new URLSearchParams(location.search).has('cover')) {
  S.tut = true; S.open = true;
  $('desktop').hidden = true; $('screen').hidden = false;
  jumpTo(1);
  const g = gridOf(1), sol = solve(LEVELS[1], 1)[0];
  [[0, 0], [1, 2], [2, 2], [3, 2], [4, 3], [5, 1], [5, 2]].forEach(([p, d]) => { g[p][d] = sol[p][d]; });
  render();
}
