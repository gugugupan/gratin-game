export const T = (zh, en, ja) => ({ zh, en, ja });
export const ORDER = ['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki'];
const ALL = [0, 1, 2, 3, 4];

export const CAST = {
  kobayashi: { name: T('小林', 'Kobayashi', '小林'), ini: T('林', 'Ko', '林'), role: T('PM · 两个孩子', 'PM · two kids', 'PM・二児の親'), hue: 18 },
  sato: { name: T('佐藤', 'Sato', '佐藤'), ini: T('佐', 'Sa', '佐'), role: T('资深后端 · 导师', 'Senior backend · mentor', 'シニアBE・メンター'), hue: 212 },
  tanaka: { name: T('田中', 'Tanaka', '田中'), ini: T('田', 'Ta', '田'), role: T('应届新人', 'New grad', '新卒'), hue: 150 },
  wang: { name: T('老王', 'Wang', '王さん'), ini: T('王', 'Wa', '王'), role: T('夜猫子后端', 'Night-owl backend', '夜型バックエンド'), hue: 270 },
  abe: { name: T('阿部', 'Abe', '阿部'), ini: T('阿', 'Ab', '阿'), role: T('UI 设计师', 'UI designer', 'UIデザイナー'), hue: 335 },
  suzuki: { name: T('铃木', 'Suzuki', '鈴木'), ini: T('铃', 'Su', '鈴'), role: T('SRE · 住在长野', 'SRE · lives in Nagano', 'SRE・長野在住'), hue: 42 },
  kuroda: { name: T('黑田', 'Kuroda', '黒田'), ini: T('黑', 'Ku', '黒'), role: T('CFO', 'CFO', 'CFO'), hue: 0, gray: true },
  mori: { name: T('森', 'Mori', '森'), ini: T('森', 'Mo', '森'), role: T('CEO', 'CEO', 'CEO'), hue: 190, gray: true },
  hr: { name: T('人事部', 'People Team', '人事部'), ini: T('人', 'HR', '人'), role: T('', '', ''), hue: 100, gray: true },
  ga: { name: T('总务部', 'General Affairs', '総務部'), ini: T('总', 'GA', '総'), role: T('', '', ''), hue: 60, gray: true },
  nakamura: { name: T('中村', 'Nakamura', '中村'), ini: T('中', 'Na', '中'), role: T('客服', 'Support', 'サポート'), hue: 175, gray: true },
  me: { name: T('你', 'You', 'あなた'), ini: T('我', 'Me', '私'), role: T('开发二组经理', 'Dev Team 2 manager', '開発2課マネージャー'), hue: 225 },
};

const WHY = {
  kobWed: T('孩子的游泳课（弹性工时）', "kids' swim class (flex hours)", '子どものプール教室（時差出勤）'),
  wangMon: T('周末刚发完版', 'just shipped a release over the weekend', '週末にリリースしたばかり'),
  wangNo: T('作息会崩', 'his sleep schedule would collapse', '生活リズムが崩れる'),
  suzCon: T('出差住宿补贴', 'business-trip hotel allowance', '出張宿泊手当'),
  tanWith: T('有人可以随时问', 'someone he can ask anything', 'いつでも質問できる人がいる'),
  abeWang: T('那天专门对接口', 'that day is for API handoffs', 'その日はAPIのすり合わせ'),
  satoFri: T('深度工作日', 'deep-work day', '集中作業日'),
};

export const LEVELS = [
  {
    quota: 1,
    title: T('一周一次', 'Once a Week', '週1回'),
    intro: T('新办公室开放了。这周每人来一次就行，哪天都可以。', 'The new office is open. Everyone comes in once this week, any day.', '新オフィスがオープン。今週は全員1回来ればOK、曜日は自由。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 0, v: 1, why: T('周一产品例会', 'Monday product sync', '月曜はプロダクト定例') }] },
      sato: { rules: [{ t: 'fixed', d: 1, v: 1, why: T('带新人参观办公室', 'giving the new hire a tour', '新人にオフィス案内') }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: T('第一次来，跟着导师', 'first visit, sticking with his mentor', '初出社なのでメンターと一緒') }] },
      wang: { rules: [{ t: 'fixed', d: 3, v: 1, why: T('去机房看服务器', 'checking servers in the machine room', 'サーバールームの点検') }] },
      abe: { rules: [{ t: 'fixed', d: 2, v: 1, why: T('和外包设计师见面', 'meeting the agency designers', '外部デザイナーと打ち合わせ') }] },
      suzuki: { rules: [{ t: 'fixed', d: 2, v: 1, why: T('来装监控大屏', 'installing the monitoring wall', '監視モニターの設置') }] },
    },
    rules: [{ t: 'cap', days: ALL, n: 2, why: T('新办公室只装好了 2 张桌子', 'only 2 desks are assembled so far', '机がまだ2台しか組み上がっていない') }],
  },
  {
    quota: 2,
    title: T('没人想来', 'Nobody Wants to Come', '誰も来たくない'),
    intro: T('出勤率目标 40%：每人 2 天。标着「申请」的在宅格子是成员自己要求的，你改不了。', 'Target: 40% attendance, 2 days each. Remote cells tagged REQ were requested by the members themselves. You can\'t change them.', '目標出社率40%：1人週2日。「申請」付きの在宅マスは本人の希望。変更できない。'),
    people: {
      kobayashi: { locks: [1, 2, 3] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: T('跟着导师', 'sticking with his mentor', 'メンターと一緒') }, { t: 'fixed', d: 2, v: 1, why: T('新人培训', 'new-hire training', '新人研修') }] },
      wang: { locks: [0, 1, 4] },
      abe: { locks: [0, 4] },
      suzuki: { locks: [0, 3, 4] },
    },
    rules: [
      { t: 'cap', d: 1, n: 1, why: T('办公室在布网线', 'network cabling in progress', 'LAN配線工事中') },
      { t: 'min', d: 4, n: 3, why: T('CFO 来视察', 'the CFO is visiting', 'CFOが視察に来る') },
    ],
  },
  {
    quota: 2,
    title: T('抽查', 'Spot Checks', '抜き打ちチェック'),
    intro: T('小林拿到了弹性工时。CFO 宣布周二、周四亲自巡视。', 'Kobayashi got flex hours. The CFO will walk the floor on Tuesday and Thursday.', '小林さんは時差出勤に。CFOが火曜と木曜にフロアを巡回すると発表。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: T('跟着导师', 'sticking with his mentor', 'メンターと一緒') }] },
      wang: { locks: [0, 1, 4] },
      abe: { locks: [0, 4] },
      suzuki: { locks: [0, 3, 4] },
    },
    rules: [{ t: 'min', days: [1, 3], n: 5, why: T('CFO 巡视日', 'CFO walk-through days', 'CFO巡回日') }],
  },
  {
    quota: 2,
    title: T('空出来的工位', 'Empty Desks', '空いた席'),
    intro: T('销售部的工位空了。会议室被拿去做面谈。田中的日历也锁上了。', "Sales has empty desks now. Meeting rooms are booked for HR interviews. Tanaka's calendar is locked too.", '営業部の席が空いた。会議室は面談で埋まっている。田中さんのカレンダーもロックされた。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      tanaka: { locks: [0, 1, 4] },
      wang: { rules: [{ t: 'fixed', d: 0, v: 0, why: WHY.wangMon }, { t: 'noconsec', why: WHY.wangNo }] },
      abe: { locks: [0, 4] },
      suzuki: { locks: [0, 3, 4] },
    },
    rules: [
      { t: 'cap', d: 1, n: 1, why: T('HR 面谈占用了工位区', 'HR interviews took over the desk area', '人事面談で執務エリアが埋まる') },
      { t: 'cap', d: 2, n: 4, why: T('其余工位在搬迁', 'the rest of the desks are being moved', '残りの席は移設中') },
      { t: 'cap', d: 4, n: 1, why: T('销售部工位被搬走', "Sales' desks are hauled away", '営業部の机を搬出') },
    ],
  },
  {
    quota: 2,
    title: T('没有咖啡的一周', 'No-Coffee Week', 'コーヒーのない週'),
    intro: T('为了省电，总务部只开放部分区域。铃木同意连着来两天。', 'To save power, General Affairs only opens part of the floor. Suzuki agreed to come in two days in a row.', '節電のため総務部はフロアの一部だけ開放。鈴木さんは2日連続で来ることに。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      tanaka: { locks: [0, 1, 4] },
      wang: { rules: [{ t: 'noconsec', why: WHY.wangNo }] },
      abe: { locks: [0, 4] },
      suzuki: { rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [
      { t: 'cap', days: [0, 3], n: 1, why: T('节电，只开 1 盏灯的区域', 'power saving, one light zone only', '節電で照明1ゾーンのみ') },
      { t: 'cap', d: 1, n: 2, why: T('节电', 'power saving', '節電') },
    ],
  },
  {
    quota: 2,
    title: T('新人的导师', 'Mentor Week', 'メンターの週'),
    intro: T('田中愿意跟着佐藤来了。可阿部的日历锁得更多了。', "Tanaka will come in with Sato now. But Abe's calendar is even more locked.", '田中さんは佐藤さんと一緒なら来られる。でも阿部さんのロックが増えた。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: WHY.tanWith }] },
      wang: { rules: [{ t: 'noconsec', why: WHY.wangNo }] },
      abe: { locks: [0, 1, 4] },
      suzuki: { rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [
      { t: 'min', d: 0, n: 5, why: T('全员站会', 'all-team stand-up', '全体朝会') },
      { t: 'min', d: 4, n: 4, why: T('周五发版，需要人值守', 'Friday release needs people on hand', '金曜リリースの立ち会い') },
    ],
  },
  {
    quota: 3,
    title: T('作战室', 'War Room', '作戦室'),
    intro: T('每人每周 3 天。会议室被公关危机小组征用了。铃木的出差补贴只批了 1 晚，所以每周 2 天。', "3 days each now. The PR crisis team took the meeting rooms. Suzuki's hotel allowance covers one night, so 2 days for him.", '1人週3日に。会議室は広報の危機対応チームが占拠。鈴木さんの宿泊手当は1泊分なので週2日。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: WHY.tanWith }] },
      abe: { locks: [0, 4] },
      suzuki: { quota: 2, rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [{ t: 'cap', days: [1, 2], n: 1, why: T('公关危机小组占用', 'taken by the PR crisis team', '広報の危機対応チームが使用') }],
  },
  {
    quota: 3,
    title: T('复盘周', 'Postmortem Week', '振り返りの週'),
    intro: T('评分开始回升。阿部的心结解开了，可佐藤的日历锁上了。', "Ratings are starting to recover. Abe is back on board, but Sato's calendar is locked now.", '評価は回復し始めた。阿部さんは戻ってきたが、今度は佐藤さんがロック。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      sato: { locks: [0, 4] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: WHY.tanWith }] },
      wang: { rules: [{ t: 'noconsec', why: WHY.wangNo }] },
      abe: { rules: [{ t: 'overlap', b: 'wang', n: 1, why: WHY.abeWang }] },
      suzuki: { quota: 2, rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [
      { t: 'min', d: 0, n: 4, why: T('事故复盘会', 'incident postmortem', '障害の振り返り会') },
      { t: 'cap', d: 3, n: 3, why: T('工位借给了客服', 'desks lent to Support', 'サポートに席を貸し出し') },
    ],
  },
  {
    quota: 3,
    title: T('回暖', 'Thaw', '雪解け'),
    intro: T('所有人的锁都解开了。周五有团队午餐。', 'Every lock is gone. Team lunch on Friday.', '全員のロックが外れた。金曜はチームランチ。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      sato: { rules: [{ t: 'fixed', d: 4, v: 0, why: WHY.satoFri }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: WHY.tanWith }] },
      wang: { rules: [{ t: 'noconsec', why: WHY.wangNo }] },
      abe: { rules: [{ t: 'overlap', b: 'wang', n: 1, why: WHY.abeWang }] },
      suzuki: { quota: 2, rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [
      { t: 'cap', d: 0, n: 1, why: T('消防检查', 'fire inspection', '消防点検') },
      { t: 'min', d: 4, n: 4, why: T('团队午餐', 'team lunch', 'チームランチ') },
    ],
  },
  {
    quota: 3,
    title: T('All Hands', 'All Hands', 'All Hands'),
    intro: T('周四 All Hands，全员到场。老王说这周可以连着来。', 'All Hands on Thursday, everyone in. Wang says back-to-back days are fine this week.', '木曜はAll Hands、全員出社。王さんは今週なら連続出社OKとのこと。'),
    people: {
      kobayashi: { rules: [{ t: 'fixed', d: 2, v: 0, why: WHY.kobWed }] },
      sato: { rules: [{ t: 'fixed', d: 4, v: 0, why: WHY.satoFri }] },
      tanaka: { rules: [{ t: 'with', b: 'sato', why: WHY.tanWith }] },
      wang: { rules: [{ t: 'fixed', d: 0, v: 0, why: WHY.wangMon }] },
      abe: { rules: [{ t: 'overlap', b: 'wang', n: 1, why: WHY.abeWang }, { t: 'fixed', d: 4, v: 1, why: T('在办公室修合影', 'retouching the group photo at the office', 'オフィスで集合写真のレタッチ') }] },
      suzuki: { quota: 2, rules: [{ t: 'consec', why: WHY.suzCon }] },
    },
    rules: [
      { t: 'min', d: 3, n: 6, why: T('All Hands', 'All Hands', 'All Hands') },
      { t: 'cap', d: 1, n: 1, why: T('布置会场', 'setting up the venue', '会場設営') },
      { t: 'cap', d: 2, n: 3, why: T('All Hands 彩排', 'All Hands rehearsal', 'All Handsのリハーサル') },
    ],
  },
].map(L => ({ ...L, people: ORDER.map(id => ({ id, ...(L.people[id] || {}), rules: L.people[id]?.rules || [] })) }));
