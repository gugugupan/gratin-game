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
    intro: T('新办公室开放了。这周每人来一次，大家都按自己方便的日子交了申请，排班表已经照着填好了。', 'The new office is open. Everyone comes in once this week; they sent in the days that suit them, and the schedule is pre-filled to match.', '新オフィスがオープン。今週は全員1回。みんな都合のいい日を申請してくれて、シフト表はそのとおり仮入力済み。'),
    people: {
      kobayashi: { wishes: [0], rules: [{ t: 'fixed', d: 0, v: 1, why: T('周一产品例会', 'Monday product sync', '月曜はプロダクト定例') }] },
      sato: { wishes: [1], rules: [{ t: 'fixed', d: 1, v: 1, why: T('带新人参观办公室', 'giving the new hire a tour', '新人にオフィス案内') }] },
      tanaka: { wishes: [1], rules: [{ t: 'with', b: 'sato', why: T('第一次来，跟着导师', 'first visit, sticking with his mentor', '初出社なのでメンターと一緒') }] },
      wang: { wishes: [3], rules: [{ t: 'fixed', d: 3, v: 1, why: T('去机房看服务器', 'checking servers in the machine room', 'サーバールームの点検') }] },
      abe: { wishes: [2], rules: [{ t: 'fixed', d: 2, v: 1, why: T('和外包设计师见面', 'meeting the agency designers', '外部デザイナーと打ち合わせ') }] },
      suzuki: { wishes: [2], rules: [{ t: 'fixed', d: 2, v: 1, why: T('来装监控大屏', 'installing the monitoring wall', '監視モニターの設置') }] },
    },
    rules: [{ t: 'cap', days: ALL, n: 2, why: T('新办公室只装好了 2 张桌子', 'only 2 desks are assembled so far', '机がまだ2台しか組み上がっていない') }],
  },
  {
    quota: 2,
    title: T('没人想来', 'Nobody Wants to Come', '誰も来たくない'),
    intro: Z('出勤率目标 40%：每人 2 天。大家都交了「想哪天来」的申请，但申请只考虑了自己。'),
    people: {
      kobayashi: { wishes: [2, 3], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [0, 2], rules: [{ t: 'fixed', d: 2, v: 1, why: Z('给新人讲代码') }] },
      tanaka: { wishes: [2, 3], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [1, 3], need: [{ t: 'fixed', d: 0, v: 0 }], needText: Z('周一在家（周末刚发完版）') },
      abe: { wishes: [3, 4], rules: [{ t: 'fixed', d: 1, v: 1, why: Z('用户访谈') }], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [0, 2], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
    },
    rules: [
      { t: 'min', d: 0, n: 4, why: Z('产品例会') },
      { t: 'cap', d: 1, n: 1, why: Z('会议室被借走') },
      { t: 'cap', d: 2, n: 1, why: Z('办公室在布网线') },
      { t: 'min', d: 4, n: 4, why: Z('CFO 来视察') },
    ],
  },
  {
    quota: 2,
    title: T('抽查', 'Spot Checks', '抜き打ちチェック'),
    intro: Z('CFO 开始抽查出勤。申请照样各说各的。'),
    people: {
      kobayashi: { wishes: [2, 3], need: [{ t: 'fixed', d: 2, v: 0 }], clue: 'kobayashi', needText: Z('周三必须在家（下午要接孩子）') },
      sato: { wishes: [0, 3], rules: [{ t: 'fixed', d: 1, v: 1, why: Z('周二主持站会') }] },
      tanaka: { wishes: [0, 2], need: [{ t: 'overlap', b: 'sato', n: 1 }], needText: Z('和佐藤恰好有 1 天一起出社') },
      wang: { wishes: [1, 2], need: [{ t: 'fixed', d: 0, v: 0 }, { t: 'noconsec' }], clue: 'wang', needText: Z('周一在家，而且不连续两天出社（作息会崩）') },
      abe: { wishes: [2, 4], rules: [{ t: 'fixed', d: 0, v: 1, why: Z('用户访谈') }], need: [{ t: 'apart', b: 'wang' }], needText: Z('不和老王同一天出社') },
      suzuki: { wishes: [0, 4], need: [{ t: 'consec' }], needText: Z('出社日连在一起（一趟新干线待两天）') },
    },
    rules: [
      { t: 'min', d: 1, n: 4, why: Z('CFO 巡视') },
      { t: 'min', d: 2, n: 4, why: Z('部门会议') },
      { t: 'min', d: 3, n: 3, why: Z('CFO 周四例会抽查') },
    ],
  },
].map(L => ({ ...L, people: ORDER.map(id => ({ id, ...(L.people[id] || {}), rules: L.people[id]?.rules || [] })) }));

export const withNeeds = L => ({ ...L, people: L.people.map(p => ({ ...p, rules: [...p.rules, ...(p.need || [])] })) });
