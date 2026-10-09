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
    intro: T('新办公室开放了。这周每人来一次。大家按自己方便的日子交了申请，但和公司的安排有些冲突，调整一下再提交。', 'The new office is open. Everyone comes in once this week. They sent in the days that suit them, but some clash with company plans. Adjust before you submit.', '新オフィスがオープン。今週は全員1回。みんな都合のいい日を申請したが、会社の予定とぶつかるところがある。調整してから提出しよう。'),
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
    intro: Z('出勤率目标 40%：每人 2 天。大家都交了「想哪天来」的申请，但申请只考虑了自己。'),
    people: {
      kobayashi: { wishes: [2, 3], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [0, 2], need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（陪父亲去医院复健）') },
      tanaka: { wishes: [2, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [3, 4], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'fixed', d: 1, v: 0 }], needText: Z('周一、周二在家（周末发版后补觉）') },
      abe: { wishes: [3, 4], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [0, 2], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
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
    intro: Z('CFO 开始抽查出勤。申请照样各说各的。'),
    people: {
      kobayashi: { wishes: [2, 3], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [0, 3], need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（陪父亲去医院复健）') },
      tanaka: { wishes: [2, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [1, 2], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: Z('周一在家，而且不连续两天出社（作息会崩）') },
      abe: { wishes: [2, 4], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [0, 4], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
    },
    rules: [
      { t: 'min', d: 0, n: 4, why: Z('CFO 周一例会抽查') },
      { t: 'min', d: 1, n: 2, why: Z('周二客户来访') },
      { t: 'min', d: 2, n: 3, why: Z('部门会议') },
      { t: 'min', d: 3, n: 3, why: Z('CFO 巡视') },
    ],
  },
].map(L => ({ ...L, people: ORDER.map(id => ({ id, ...(L.people[id] || {}), rules: L.people[id]?.rules || [] })) }));

export const withNeeds = L => ({ ...L, people: L.people.map(p => ({ ...p, rules: [...p.rules, ...(p.need || [])] })) });
