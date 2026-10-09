export const T = (zh, en, ja) => ({ zh, en, ja });
export const ORDER = ['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki'];
const ALL = [0, 1, 2, 3, 4];

export const CAST = {
  kobayashi: { name: T('小林', 'Kobayashi', '小林'), ini: T('林', 'Ko', '林'), role: T('PM', 'PM', 'PM'), hue: 18 },
  sato: { name: T('佐藤', 'Sato', '佐藤'), ini: T('佐', 'Sa', '佐'), role: T('资深后端', 'Senior backend', 'シニアバックエンド'), hue: 212 },
  tanaka: { name: T('田中', 'Tanaka', '田中'), ini: T('田', 'Ta', '田'), role: T('新人工程师', 'Junior engineer', '新人エンジニア'), hue: 150 },
  wang: { name: T('老王', 'Wang', '王さん'), ini: T('王', 'Wa', '王'), role: T('后端', 'Backend', 'バックエンド'), hue: 270 },
  abe: { name: T('阿部', 'Abe', '阿部'), ini: T('阿', 'Ab', '阿'), role: T('UI 设计师', 'UI designer', 'UIデザイナー'), hue: 335 },
  suzuki: { name: T('铃木', 'Suzuki', '鈴木'), ini: T('铃', 'Su', '鈴'), role: T('SRE', 'SRE', 'SRE'), hue: 42 },
  kuroda: { name: T('黑田', 'Kuroda', '黒田'), ini: T('黑', 'Ku', '黒'), role: T('CFO', 'CFO', 'CFO'), hue: 0, gray: true },
  mori: { name: T('森', 'Mori', '森'), ini: T('森', 'Mo', '森'), role: T('CEO', 'CEO', 'CEO'), hue: 190, gray: true },
  hr: { name: T('人事部', 'People Team', '人事部'), ini: T('人', 'HR', '人'), role: T('', '', ''), hue: 100, gray: true },
  ga: { name: T('总务部', 'General Affairs', '総務部'), ini: T('总', 'GA', '総'), role: T('', '', ''), hue: 60, gray: true },
  nakamura: { name: T('中村', 'Nakamura', '中村'), ini: T('中', 'Na', '中'), role: T('客服', 'Support', 'サポート'), hue: 175, gray: true },
  me: { name: T('你', 'You', 'あなた'), ini: T('我', 'Me', '私'), role: T('开发二组经理', 'Dev Team 2 manager', '開発2課マネージャー'), hue: 225 },
};

const P = {
  kob: { need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: T('周三必须在家（下午要接孩子）', 'Remote on Wed (picks up the kids in the afternoon)', '水曜は在宅（午後に子どものお迎え）') },
  satoMon: { need: [{ t: 'fixed', d: 0, v: 0 }], needText: T('周一在家（陪父亲去医院复健）', 'Remote on Mon (takes his father to rehab)', '月曜は在宅（父親のリハビリの付き添い）') },
  satoFri: { need: [{ t: 'fixed', d: 4, v: 0 }], clue: 'sato', needText: T('周五在家（深度工作日，谁都别找他）', 'Remote on Fri (deep-work day, nobody bothers him)', '金曜は在宅（集中作業日、誰も話しかけない）') },
  tan1: { need: [{ t: 'overlap', b: 'sato', n: 1 }], clue: 'tanaka', needText: T('和佐藤恰好有 1 天一起出社', 'Exactly 1 office day together with Sato', '佐藤さんと同じ出社日がちょうど1日') },
  tan2: { need: [{ t: 'overlap', b: 'sato', n: 2 }], clue: 'tanaka', needText: T('和佐藤恰好有 2 天一起出社', 'Exactly 2 office days together with Sato', '佐藤さんと同じ出社日がちょうど2日') },
  wang2: { need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: T('周一在家，而且不连续两天出社（作息会崩）', 'Remote on Mon, and never two office days in a row (his sleep schedule would collapse)', '月曜は在宅、2日連続の出社はNG（生活リズムが崩れる）') },
  wang3: { need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'maxrun', n: 2 }], clue: 'wang', needText: T('周一在家，而且不连续三天出社（作息会崩）', 'Remote on Mon, and never three office days in a row (his sleep schedule would collapse)', '月曜は在宅、3日連続の出社はNG（生活リズムが崩れる）') },
  wangAH: { need: [{ t: 'fixed', d: 0, v: 0 }], clue: 'wang', needText: T('周一在家（为了合影，这周连着来也行）', 'Remote on Mon (for the group photo, back-to-back days are fine this week)', '月曜は在宅（集合写真のため、今週は連続出社もOK）') },
  abeApart: { need: [{ t: 'apart', b: 'wang' }], needText: T('不和老王同一天出社（青轴键盘）', 'Never on the same day as Wang (clicky keyboard)', '王さんと同じ日は出社しない（青軸キーボード）') },
  abeWith: { need: [{ t: 'overlap', b: 'wang', n: 1 }], clue: 'abe', needText: T('和老王恰好 1 天同时出社（那天专门对接口）', 'Exactly 1 office day together with Wang (that day is for API handoffs)', '王さんと同じ出社日がちょうど1日（その日はAPIのすり合わせ）') },
  suz: { need: [{ t: 'consec' }], clue: 'suzuki', needText: T('出社日连在一起（一趟新干线待两天）', 'Office days back-to-back (one Shinkansen trip, two days)', '出社日は連続（新幹線1往復で2日）') },
};
const biz = (d, why) => [{ t: 'fixed', d, v: 1, why }];
const SUZ2 = { quota: 2 };

const WHY = {
  kobWed: T('孩子的游泳课（弹性工时）', "kids' swim class (flex hours)", '子どものプール教室（時差出勤）'),
  wangMon: T('周末刚发完版', 'just shipped a release over the weekend', '週末にリリースしたばかり'),
  wangNo: T('作息会崩', 'his sleep schedule would collapse', '生活リズムが崩れる'),
  suzCon: T('出差住宿补贴', 'business-trip hotel allowance', '出張宿泊手当'),
  tanSato: T('有佐藤在的日子随时能问，其余日子试着自己来', 'he can ask Sato anything on shared days, and tries on his own the rest', '佐藤さんがいる日は質問し放題、ほかの日は自力で'),
  abeWang: T('那天专门对接口', 'that day is for API handoffs', 'その日はAPIのすり合わせ'),
  satoFri: T('深度工作日', 'deep-work day', '集中作業日'),
};

export const LEVELS = [
  {
    quota: 1,
    title: T('一周一次', 'Once a Week', '週1回'),
    intro: T('新办公室开放的第一周。', 'First week in the new office.', '新オフィス最初の週。'),
    people: {
      kobayashi: { wishes: [0] },
      sato: { wishes: [1] },
      tanaka: { wishes: [2] },
      wang: { wishes: [4] },
      abe: { wishes: [2] },
      suzuki: { wishes: [2] },
    },
    rules: [{ t: 'cap', days: ALL, n: 2, why: T('新办公室只装好了 2 张桌子', 'only 2 desks are assembled so far', '机がまだ2台しか組み上がっていない') }],
  },
  {
    quota: 2,
    title: T('没人想来', 'Nobody Wants to Come', '誰も来たくない'),
    intro: T('新出勤政策的第一周。', 'First week of the new attendance policy.', '新しい出社ポリシーの最初の週。'),
    people: {
      kobayashi: { wishes: [0, 1], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: T('周三必须在家（下午要接孩子）', 'Remote on Wed (picks up the kids in the afternoon)', '水曜は在宅（午後に子どものお迎え）') },
      sato: { wishes: [1, 2], need: [{ t: 'fixed', d: 0, v: 0 }], needText: T('周一在家（陪父亲去医院复健）', 'Remote on Mon (takes his father to rehab)', '月曜は在宅（父親のリハビリの付き添い）') },
      tanaka: { wishes: [1, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: T('和佐藤恰好有 1 天一起出社', 'Exactly 1 office day together with Sato', '佐藤さんと同じ出社日がちょうど1日') },
      wang: { wishes: [2, 4], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'fixed', d: 1, v: 0 }], needText: T('周一、周二在家（周末发版后补觉）', 'Remote on Mon and Tue (catching up on sleep after a weekend release)', '月曜・火曜は在宅（週末リリース後の寝だめ）') },
      abe: { wishes: [0, 3], need: [{ t: 'apart', b: 'wang' }], needText: T('不和老王同一天出社', 'Never on the same day as Wang', '王さんと同じ日は出社しない') },
      suzuki: { wishes: [1, 2], need: [{ t: 'consec' }], needText: T('出社日连在一起（一趟新干线待两天）', 'Office days back-to-back (one Shinkansen trip, two days)', '出社日は連続（新幹線1往復で2日）') },
    },
    rules: [
      { t: 'cap', d: 0, n: 3, why: T('周一一部分工位在搬', 'some desks are being moved on Monday', '月曜は一部の席を移動中') },
      { t: 'cap', d: 1, n: 2, why: T('会议室被借走', 'the meeting room is booked by another team', '会議室を他部署に貸し出し') },
      { t: 'cap', d: 2, n: 1, why: T('办公室在布网线', 'network cables are being laid', 'LAN配線工事中') },
      { t: 'cap', d: 3, n: 1, why: T('空调检修', 'air-conditioning maintenance', '空調点検') },
    ],
  },
  {
    quota: 2,
    title: T('抽查', 'Spot Checks', '抜き打ちチェック'),
    intro: T('销售部空出了一排工位。', 'A whole row of desks in Sales is empty now.', '営業部の席が一列空いた。'),
    people: {
      kobayashi: { wishes: [0, 1], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: T('周三必须在家（下午要接孩子）', 'Remote on Wed (picks up the kids in the afternoon)', '水曜は在宅（午後に子どものお迎え）') },
      sato: { wishes: [3, 4], need: [{ t: 'fixed', d: 0, v: 0 }], needText: T('周一在家（陪父亲去医院复健）', 'Remote on Mon (takes his father to rehab)', '月曜は在宅（父親のリハビリの付き添い）') },
      tanaka: { wishes: [2, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: T('和佐藤恰好有 1 天一起出社', 'Exactly 1 office day together with Sato', '佐藤さんと同じ出社日がちょうど1日') },
      wang: { wishes: [1, 4], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: T('周一在家，而且不连续两天出社（作息会崩）', 'Remote on Mon, and never two office days in a row (his sleep schedule would collapse)', '月曜は在宅、2日連続の出社はNG（生活リズムが崩れる）') },
      abe: { wishes: [0, 2], need: [{ t: 'apart', b: 'wang' }], needText: T('不和老王同一天出社', 'Never on the same day as Wang', '王さんと同じ日は出社しない') },
      suzuki: { wishes: [3, 4], need: [{ t: 'consec' }], needText: T('出社日连在一起（一趟新干线待两天）', 'Office days back-to-back (one Shinkansen trip, two days)', '出社日は連続（新幹線1往復で2日）') },
    },
    rules: [
      { t: 'min', d: 0, n: 4, why: T('CFO 周一例会抽查', 'CFO spot-checks at the Monday meeting', '月曜定例でCFOが抜き打ちチェック') },
      { t: 'min', d: 1, n: 2, why: T('周二客户来访', 'client visit on Tuesday', '火曜は顧客来訪') },
      { t: 'min', d: 2, n: 3, why: T('部门会议', 'department meeting', '部門会議') },
      { t: 'min', d: 3, n: 3, why: T('CFO 巡视', 'CFO walk-around', 'CFOの巡回') },
    ],
  },
  {
    quota: 2,
    title: T('没有咖啡的一周', 'The Week Without Coffee', 'コーヒーのない週'),
    intro: T('咖啡停了，交通费有了上限。', 'The coffee is gone, and commuting allowance has a cap.', 'コーヒーは終了、交通費には上限がついた。'),
    people: {
      kobayashi: { ...P.kob, wishes: [1, 4], rules: biz(1, T('周二要和客户当面过需求', 'going over requirements with the client in person on Tuesday', '火曜は顧客と対面で要件確認')) },
      sato: { ...P.satoMon, wishes: [3, 4] },
      tanaka: { ...P.tan1, wishes: [0, 3] },
      wang: { ...P.wang2, wishes: [1, 3] },
      abe: { ...P.abeApart, wishes: [0, 2] },
      suzuki: { ...P.suz, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 3, n: 5, why: T('周四 CFO 带董事来参观', 'the CFO brings board members for a tour on Thursday', '木曜はCFOが取締役を連れて見学') },
      { t: 'cap', d: 2, n: 1, why: T('周三楼层消防检查', 'floor fire inspection on Wednesday', '水曜はフロアの消防点検') },
      { t: 'cap', d: 1, n: 1, why: T('周二会议室被面谈占用', 'meeting rooms are taken for interviews on Tuesday', '火曜は会議室が面談で埋まる') },
    ],
  },
  {
    quota: 2,
    title: T('新人的导师', "The New Hire's Mentor", '新人のメンター'),
    intro: T('出勤率开始按天公示。', 'Attendance is now posted every day.', '出社率が毎日掲示されるようになった。'),
    people: {
      kobayashi: { ...P.kob, wishes: [1, 4] },
      sato: { ...P.satoMon, wishes: [3, 4] },
      tanaka: { ...P.tan1, wishes: [2, 4] },
      wang: { ...P.wang2, wishes: [1, 3] },
      abe: { ...P.abeApart, wishes: [2, 4], rules: biz(4, T('周五和市场部当面评审设计稿', 'design review with Marketing in person on Friday', '金曜はマーケ部と対面でデザインレビュー')) },
      suzuki: { ...P.suz, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 4, n: 4, why: T('周五出勤率要上周报', 'Friday attendance goes into the weekly report', '金曜の出社率は週報に載る') },
      { t: 'min', d: 0, n: 3, why: T('CFO 周一例会抽查', 'CFO spot-checks at the Monday meeting', '月曜定例でCFOが抜き打ちチェック') },
      { t: 'min', d: 1, n: 4, why: T('周二客户来访', 'client visit on Tuesday', '火曜は顧客来訪') },
    ],
  },
  {
    quota: 3,
    title: T('作战室', 'The War Room', '作戦室'),
    intro: T('评分跌到 2.1。开发部门每周出社 3 天。', 'The rating fell to 2.1. Engineering is in the office 3 days a week.', '評価は2.1まで下落。開発部門は週3日出社に。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 1, 4] },
      sato: { ...P.satoMon, wishes: [1, 2, 4] },
      tanaka: { ...P.tan2, wishes: [1, 2, 3] },
      wang: { ...P.wang3, wishes: [1, 3, 4] },
      abe: { ...P.abeWith, wishes: [0, 2, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [3, 4], rules: biz(4, T('周五机房换服务器', 'swapping servers in the machine room on Friday', '金曜はサーバールームでサーバー交換')) },
    },
    rules: [
      { t: 'cap', d: 1, n: 1, why: T('公关危机小组征用了会议室', 'the PR crisis team took over the meeting room', '広報の危機対応チームが会議室を占拠') },
      { t: 'cap', d: 3, n: 4, why: T('节电，周四只开一半灯', 'power saving: only half the lights on Thursday', '節電で木曜は照明が半分だけ') },
      { t: 'cap', d: 4, n: 5, why: T('有一张桌子坏了', 'one desk is broken', '机が1台壊れている') },
    ],
  },
  {
    quota: 3,
    title: T('一千条差评', 'A Thousand Bad Reviews', '低評価1000件'),
    intro: T('评分还在 2 字头。', 'The rating is still stuck in the 2s.', '評価はまだ2点台。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 3, 4] },
      sato: { ...P.satoMon, wishes: [1, 2, 3] },
      tanaka: { ...P.tan2, wishes: [0, 1, 2] },
      wang: { ...P.wang3, wishes: [1, 3, 4], rules: biz(3, T('周四要在机房回滚数据', 'rolling back data in the machine room on Thursday', '木曜はサーバールームでデータのロールバック')) },
      abe: { ...P.abeWith, wishes: [0, 2, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [2, 3] },
    },
    rules: [
      { t: 'cap', d: 3, n: 1, why: T('周四办公室借给董事会', 'the office is lent to the board on Thursday', '木曜はオフィスを取締役会に貸し出し') },
      { t: 'cap', d: 4, n: 3, why: T('周五分区熄灯', 'zoned lights-out on Friday', '金曜はエリア別消灯') },
      { t: 'min', d: 2, n: 4, why: T('周三作战室全员复盘', 'full war-room retro on Wednesday', '水曜は作戦室で全員振り返り') },
    ],
  },
  {
    quota: 3,
    title: T('复盘周', 'Retro Week', '振り返りの週'),
    intro: T('评分开始回升。', 'The rating is starting to climb.', '評価が回復し始めた。'),
    people: {
      kobayashi: { ...P.kob, wishes: [1, 3, 4] },
      sato: { ...P.satoFri, wishes: [0, 1, 2] },
      tanaka: { ...P.tan2, wishes: [0, 1, 4] },
      wang: { ...P.wang3, wishes: [1, 2, 4], rules: biz(2, T('周三要去机房发修复版', 'shipping the fix from the machine room on Wednesday', '水曜はサーバールームで修正版をリリース')) },
      abe: { ...P.abeWith, wishes: [0, 2, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [2, 3] },
    },
    rules: [
      { t: 'cap', d: 2, n: 1, why: T('周三楼层电路检修', 'electrical work on the floor on Wednesday', '水曜はフロアの電気工事') },
      { t: 'cap', d: 4, n: 2, why: T('周五分区熄灯', 'zoned lights-out on Friday', '金曜はエリア別消灯') },
      { t: 'cap', d: 3, n: 3, why: T('周四会议室被借走', 'the meeting room is booked out on Thursday', '木曜は会議室を貸し出し') },
    ],
  },
  {
    quota: 3,
    title: T('最后一周作战室', 'The Last War-Room Week', '作戦室、最後の週'),
    intro: T('评分 3.4。这周五之前要回到 4.0。', 'Rating 3.4. It has to be back at 4.0 by this Friday.', '評価3.4。今週金曜までに4.0に戻さなければ。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 1, 3] },
      sato: { ...P.satoFri, wishes: [0, 1, 2] },
      tanaka: { ...P.tan2, wishes: [1, 2, 4] },
      wang: { ...P.wang3, wishes: [1, 3, 4], rules: biz(3, T('周四机房演练', 'machine-room drill on Thursday', '木曜はサーバールームで訓練')) },
      abe: { ...P.abeWith, wishes: [0, 1, 2] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 4, n: 5, why: T('周五 CFO 来看作战室', 'the CFO visits the war room on Friday', '金曜はCFOが作戦室を視察') },
      { t: 'cap', d: 3, n: 2, why: T('周四一半工位在打蜡', 'half the desks are being waxed on Thursday', '木曜は半分の席でワックスがけ') },
      { t: 'cap', d: 0, n: 3, why: T('周一会议室被面谈占用', 'meeting rooms are taken for interviews on Monday', '月曜は会議室が面談で埋まる') },
    ],
  },
  {
    quota: 3,
    title: T('All Hands', 'All Hands', 'All Hands'),
    intro: T('周四 All Hands，全员到场。', 'All Hands on Thursday. Everyone has to be there.', '木曜はAll Hands、全員出席。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 3, 4] },
      sato: { ...P.satoFri, wishes: [0, 1, 2], rules: biz(1, T('周二彩排 All Hands 的演示', 'rehearsing the All Hands demo on Tuesday', '火曜はAll Handsのデモのリハーサル')) },
      tanaka: { ...P.tan2, wishes: [1, 2, 3] },
      wang: { ...P.wangAH, wishes: [2, 3, 4] },
      abe: { ...P.abeWith, wishes: [0, 1, 4], rules: biz(1, T('周二彩排 All Hands 的演示', 'rehearsing the All Hands demo on Tuesday', '火曜はAll Handsのデモのリハーサル')) },
      suzuki: { ...P.suz, ...SUZ2, wishes: [3, 4] },
    },
    rules: [
      { t: 'min', d: 3, n: 6, hard: true, why: T('All Hands，全员到场', 'All Hands, everyone attends', 'All Hands、全員出席') },
      { t: 'cap', d: 4, n: 1, why: T('周五办公室布置年会', 'the office is being set up for the year-end party on Friday', '金曜は忘年会の準備でオフィスを使用') },
      { t: 'min', d: 0, n: 4, why: T('CFO 周一例会', "CFO's Monday meeting", '月曜のCFO定例') },
    ],
  },
].map(L => ({ ...L, people: ORDER.map(id => ({ id, ...(L.people[id] || {}), rules: L.people[id]?.rules || [] })) }));

export const withNeeds = L => ({ ...L, people: L.people.map(p => ({ ...p, rules: [...p.rules, ...(p.need || [])] })) });

export const MORALE = { week: 8, need: 5 };
