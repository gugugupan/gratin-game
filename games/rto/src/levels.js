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

const Z = s => T(s, s, s);

const P = {
  kob: { need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
  satoMon: { need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（陪父亲去医院复健）') },
  satoFri: { need: [{ t: 'fixed', d: 4, v: 0 }], clue: 'sato', needText: Z('周五在家（深度工作日，谁都别找他）') },
  tan1: { need: [{ t: 'overlap', b: 'sato', n: 1 }], clue: 'tanaka', needText: Z('和佐藤恰好有 1 天一起出社') },
  tan2: { need: [{ t: 'overlap', b: 'sato', n: 2 }], clue: 'tanaka', needText: Z('和佐藤恰好有 2 天一起出社') },
  wang2: { need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: Z('周一在家，而且不连续两天出社（作息会崩）') },
  wang3: { need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'maxrun', n: 2 }], clue: 'wang', needText: Z('周一在家，而且不连续三天出社（作息会崩）') },
  wangAH: { need: [{ t: 'fixed', d: 0, v: 0 }], clue: 'wang', needText: Z('周一在家（为了合影，这周连着来也行）') },
  abeApart: { need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社（青轴键盘）') },
  abeWith: { need: [{ t: 'overlap', b: 'wang', n: 1 }], clue: 'abe', needText: Z('和老王恰好 1 天同时出社（那天专门对接口）') },
  suz: { need: [{ t: 'consec' }], clue: 'suzuki', needText: Z('出社日连在一起（一趟新干线待两天）') },
};
const biz = (d, why) => [{ t: 'fixed', d, v: 1, why: Z(why) }];
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
    intro: Z('新出勤政策的第一周。'),
    people: {
      kobayashi: { wishes: [0, 1], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [1, 2], need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（陪父亲去医院复健）') },
      tanaka: { wishes: [1, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [2, 4], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'fixed', d: 1, v: 0 }], needText: Z('周一、周二在家（周末发版后补觉）') },
      abe: { wishes: [0, 3], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [1, 2], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
    },
    rules: [
      { t: 'cap', d: 0, n: 3, why: Z('周一一部分工位在搬') },
      { t: 'cap', d: 1, n: 2, why: Z('会议室被借走') },
      { t: 'cap', d: 2, n: 1, why: Z('办公室在布网线') },
      { t: 'cap', d: 3, n: 1, why: Z('空调检修') },
    ],
  },
  {
    quota: 2,
    title: T('抽查', 'Spot Checks', '抜き打ちチェック'),
    intro: Z('销售部空出了一排工位。'),
    people: {
      kobayashi: { wishes: [0, 1], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [3, 4], need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（陪父亲去医院复健）') },
      tanaka: { wishes: [2, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [1, 4], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: Z('周一在家，而且不连续两天出社（作息会崩）') },
      abe: { wishes: [0, 2], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [3, 4], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
    },
    rules: [
      { t: 'min', d: 0, n: 4, why: Z('CFO 周一例会抽查') },
      { t: 'min', d: 1, n: 2, why: Z('周二客户来访') },
      { t: 'min', d: 2, n: 3, why: Z('部门会议') },
      { t: 'min', d: 3, n: 3, why: Z('CFO 巡视') },
    ],
  },
  {
    quota: 2,
    title: Z('没有咖啡的一周'),
    intro: Z('咖啡停了，交通费有了上限。'),
    people: {
      kobayashi: { ...P.kob, wishes: [3, 4], rules: biz(1, '周二要和客户当面过需求') },
      sato: { ...P.satoMon, wishes: [3, 4] },
      tanaka: { ...P.tan1, wishes: [0, 3] },
      wang: { ...P.wang2, wishes: [1, 3] },
      abe: { ...P.abeApart, wishes: [0, 2] },
      suzuki: { ...P.suz, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 3, n: 5, why: Z('周四 CFO 带董事来参观') },
      { t: 'cap', d: 2, n: 1, why: Z('周三楼层消防检查') },
      { t: 'cap', d: 1, n: 1, why: Z('周二会议室被面谈占用') },
    ],
  },
  {
    quota: 2,
    title: Z('新人的导师'),
    intro: Z('出勤率开始按天公示。'),
    people: {
      kobayashi: { ...P.kob, wishes: [1, 4] },
      sato: { ...P.satoMon, wishes: [3, 4] },
      tanaka: { ...P.tan1, wishes: [2, 4] },
      wang: { ...P.wang2, wishes: [1, 4] },
      abe: { ...P.abeApart, wishes: [0, 3], rules: biz(4, '周五和市场部当面评审设计稿') },
      suzuki: { ...P.suz, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 4, n: 4, why: Z('周五出勤率要上周报') },
      { t: 'min', d: 0, n: 3, why: Z('CFO 周一例会抽查') },
      { t: 'min', d: 1, n: 4, why: Z('周二客户来访') },
    ],
  },
  {
    quota: 3,
    title: Z('作战室'),
    intro: Z('评分跌到 2.1。开发部门每周出社 3 天。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 1, 4] },
      sato: { ...P.satoMon, wishes: [1, 2, 4] },
      tanaka: { ...P.tan2, wishes: [1, 2, 3] },
      wang: { ...P.wang3, wishes: [1, 3, 4] },
      abe: { ...P.abeWith, wishes: [0, 2, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [2, 3], rules: biz(4, '周五机房换服务器') },
    },
    rules: [
      { t: 'cap', d: 1, n: 1, why: Z('公关危机小组征用了会议室') },
      { t: 'cap', d: 3, n: 4, why: Z('节电，周四只开一半灯') },
      { t: 'cap', d: 4, n: 5, why: Z('有一张桌子坏了') },
    ],
  },
  {
    quota: 3,
    title: Z('一千条差评'),
    intro: Z('评分还在 2 字头。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 3, 4] },
      sato: { ...P.satoMon, wishes: [1, 2, 3] },
      tanaka: { ...P.tan2, wishes: [0, 1, 2] },
      wang: { ...P.wang3, wishes: [1, 2, 4], rules: biz(3, '周四要在机房回滚数据') },
      abe: { ...P.abeWith, wishes: [0, 1, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [2, 3] },
    },
    rules: [
      { t: 'cap', d: 3, n: 1, why: Z('周四办公室借给董事会') },
      { t: 'cap', d: 4, n: 3, why: Z('周五分区熄灯') },
      { t: 'min', d: 2, n: 4, why: Z('周三作战室全员复盘') },
    ],
  },
  {
    quota: 3,
    title: Z('复盘周'),
    intro: Z('评分开始回升。'),
    people: {
      kobayashi: { ...P.kob, wishes: [1, 3, 4] },
      sato: { ...P.satoFri, wishes: [0, 1, 2] },
      tanaka: { ...P.tan2, wishes: [0, 1, 4] },
      wang: { ...P.wang3, wishes: [1, 3, 4], rules: biz(2, '周三要去机房发修复版') },
      abe: { ...P.abeWith, wishes: [0, 1, 2] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [2, 3] },
    },
    rules: [
      { t: 'cap', d: 2, n: 1, why: Z('周三楼层电路检修') },
      { t: 'cap', d: 4, n: 2, why: Z('周五分区熄灯') },
      { t: 'cap', d: 3, n: 3, why: Z('周四会议室被借走') },
    ],
  },
  {
    quota: 3,
    title: Z('最后一周作战室'),
    intro: Z('评分 3.4。这周五之前要回到 4.0。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 1, 3] },
      sato: { ...P.satoFri, wishes: [0, 1, 2] },
      tanaka: { ...P.tan2, wishes: [1, 2, 4] },
      wang: { ...P.wang3, wishes: [1, 2, 4], rules: biz(3, '周四机房演练') },
      abe: { ...P.abeWith, wishes: [0, 1, 3] },
      suzuki: { ...P.suz, ...SUZ2, wishes: [1, 2] },
    },
    rules: [
      { t: 'min', d: 4, n: 5, why: Z('周五 CFO 来看作战室') },
      { t: 'cap', d: 3, n: 2, why: Z('周四一半工位在打蜡') },
      { t: 'cap', d: 0, n: 3, why: Z('周一会议室被面谈占用') },
    ],
  },
  {
    quota: 3,
    title: T('All Hands', 'All Hands', 'All Hands'),
    intro: Z('周四 All Hands，全员到场。'),
    people: {
      kobayashi: { ...P.kob, wishes: [0, 3, 4] },
      sato: { ...P.satoFri, wishes: [0, 2, 3], rules: biz(1, '周二彩排 All Hands 的演示') },
      tanaka: { ...P.tan2, wishes: [1, 2, 3] },
      wang: { ...P.wangAH, wishes: [2, 3, 4] },
      abe: { ...P.abeWith, wishes: [0, 1, 4], rules: biz(1, '周二彩排 All Hands 的演示') },
      suzuki: { ...P.suz, ...SUZ2, wishes: [3, 4] },
    },
    rules: [
      { t: 'min', d: 3, n: 6, hard: true, why: Z('All Hands，全员到场') },
      { t: 'cap', d: 4, n: 1, why: Z('周五办公室布置年会') },
      { t: 'min', d: 0, n: 4, why: Z('CFO 周一例会') },
    ],
  },
].map(L => ({ ...L, people: ORDER.map(id => ({ id, ...(L.people[id] || {}), rules: L.people[id]?.rules || [] })) }));

export const withNeeds = L => ({ ...L, people: L.people.map(p => ({ ...p, rules: [...p.rules, ...(p.need || [])] })) });

export const MORALE = { week: 8, need: 5 };
