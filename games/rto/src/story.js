import { T } from './levels.js';

const Z = s => T(s, s, s);

export const COMPANY = T('一个公司', 'A Company', 'ある会社');

export const EMAILS = {
  remind: {
    from: 'kuroda', date: Z('周五 18:30'),
    to: Z('开发二组经理'),
    subject: Z('关于开发二组的出勤率'),
    body: [Z('你好。'), Z('上周开发二组的出勤率没有达到目标。请多加留意。'), Z('黑田')],
  },
  warn: {
    from: 'kuroda', date: Z('周五 18:30'),
    to: Z('开发二组经理'),
    subject: Z('【警告】开发二组出勤率再次未达标'),
    body: [Z('开发二组的出勤率第二次没有达到目标。'), Z('如果再有一次，我将不得不重新评估你的岗位。'), Z('黑田')],
  },
  welcome: {
    from: 'hr', date: T('10月9日 周五 10:02', 'Fri, Oct 9 · 10:02', '10月9日(金) 10:02'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('【新办公室】欢迎回来看看', '[New Office] Come take a look', '【新オフィス】ぜひ一度お越しください'),
    body: [
      T('各位：', 'Hi everyone,', '皆さま'),
      T('新办公室已经装修完毕。为了让大家熟悉环境，下周请每人来一次，哪天都可以。', 'The new office is finally ready. To help everyone get familiar with it, please come in once next week, any day you like.', '新オフィスの内装工事が完了しました。慣れていただくため、来週どこか1日だけお越しください。'),
      T('咖啡机是新的，免费。', 'The coffee machine is brand new. Coffee is free.', 'コーヒーマシンは新品、無料です。'),
      T('另外，各组经理请用 WeekGrid 提交本组排班。', 'Managers, please submit your team schedule in WeekGrid.', '各マネージャーはWeekGridでチームのシフトを提出してください。'),
    ],
  },
  cfo: {
    from: 'kuroda', date: T('10月16日 周五 18:47', 'Fri, Oct 16 · 18:47', '10月16日(金) 18:47'),
    to: T('全体员工；各部门经理', 'All staff; All managers', '全社員、各部門マネージャー'),
    subject: T('关于出勤政策的通知', 'Attendance Policy Update', '出社ポリシー変更のお知らせ'),
    body: [
      T('各位好，我是本月入职的 CFO 黑田。', "Hello all. I'm Kuroda, your new CFO as of this month.", '今月着任しましたCFOの黒田です。'),
      T('经过审查，本公司办公室的利用率只有 18%，而每月租金约 1,200 万日元。', 'After review, our office utilization is 18%, against roughly ¥12 million a month in rent.', '調査の結果、当社オフィスの利用率は18%、家賃は月約1,200万円です。'),
      T('自下周起：① 全员每周出社至少 2 天（出勤率 40%）；② 各团队出勤率每周公示；③ 出勤率将纳入经理考核。', 'Effective next week: (1) everyone works from the office at least 2 days a week (40% attendance); (2) team attendance is published weekly; (3) attendance becomes part of manager evaluations.', '来週より、①全員週2日以上の出社（出社率40%）、②チーム別出社率の毎週公開、③出社率をマネージャー評価に反映、とします。'),
      T('期待各位的配合。', 'Thank you for your cooperation.', 'ご協力をお願いします。'),
    ],
    table: {
      head: [T('团队', 'Team', 'チーム'), T('上周出勤率', 'Last week', '先週の出社率')],
      rows: [
        [T('销售部', 'Sales', '営業部'), '38%'],
        [T('开发一组', 'Dev Team 1', '開発1課'), '31%'],
        [T('开发二组', 'Dev Team 2', '開発2課'), '20%', true],
      ],
    },
  },
  layoff: {
    from: 'hr', date: T('10月30日 周五 17:30', 'Fri, Oct 30 · 17:30', '10月30日(金) 17:30'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('组织调整通知', 'Organizational Changes', '組織変更のお知らせ'),
    body: [
      T('为提升经营效率，销售部将进行组织调整，涉及约 30% 的岗位。相关同事已单独通知。', 'To improve efficiency, we are restructuring Sales, affecting about 30% of roles. Those affected have been notified individually.', '経営効率化のため、営業部の組織再編を行います。対象は約30%の職務で、該当者には個別に連絡済みです。'),
      T('下周 3 楼会议室将用于面谈。', '3F meeting rooms will be used for interviews next week.', '来週、3階会議室は面談に使用します。'),
      T('其他部门暂无调整计划。', 'There are currently no plans for other departments.', 'その他の部門について現時点で計画はありません。'),
    ],
  },
  perks: {
    from: 'ga', date: T('11月6日 周五 12:00', 'Fri, Nov 6 · 12:00', '11月6日(金) 12:00'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('福利制度调整', 'Changes to Employee Benefits', '福利厚生の見直しについて'),
    body: [
      T('自即日起：', 'Effective immediately:', '本日より以下の通り変更します。'),
      T('① 办公室免费咖啡停止提供（咖啡机保留）；② 通勤交通费每月上限调整为 3 万日元；③ 取消年末聚会预算；④ 办公区分区照明以节省电费。', '(1) Free office coffee is discontinued (the machine stays); (2) commuting allowance is capped at ¥30,000/month; (3) the year-end party budget is cancelled; (4) office lighting will be zoned to save power.', '①オフィスの無料コーヒーを終了（マシンは残します）②通勤手当の上限を月3万円に変更 ③忘年会予算の廃止 ④節電のためエリア別消灯を実施。'),
      T('感谢各位理解。', 'Thank you for understanding.', 'ご理解のほどよろしくお願いします。'),
    ],
  },
  warroom: {
    from: 'kuroda', date: T('11月20日 周五 21:15', 'Fri, Nov 20 · 21:15', '11月20日(金) 21:15'),
    to: T('开发部门全体', 'All Engineering', '開発部門全員'),
    subject: T('紧急：线下作战体制', 'URGENT: In-Office War Room', '【緊急】出社による対策体制について'),
    body: [
      T('鉴于产品评分急剧下滑，开发部门自下周起每周出社 3 天，直至应用评分恢复到 4.0 以上。', 'Given the sharp drop in our app rating, Engineering will work from the office 3 days a week starting next week, until the rating is back above 4.0.', 'アプリ評価の急落を受け、開発部門は来週より評価が4.0以上に回復するまで週3日出社とします。'),
      T('危机时刻，更需要面对面沟通。', 'In a crisis, we need to talk face to face.', '危機のときこそ対面でのコミュニケーションが必要です。'),
      T('各团队出勤率改为每日公示。', 'Team attendance will now be published daily.', 'チーム別出社率は毎日公開に変更します。'),
    ],
  },
  allhands: {
    from: 'mori', date: T('12月11日 周五 16:00', 'Fri, Dec 11 · 16:00', '12月11日(金) 16:00'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('下周四 All Hands', 'All Hands next Thursday', '来週木曜 All Hands'),
    body: [
      T('这一个多月，大家辛苦了。', 'It has been a hard month and a half. Thank you, all of you.', 'この1か月半、本当にお疲れさまでした。'),
      T('应用评分已经回到 4.3。下周四我们在办公室开 All Hands，我想当面向每个人道谢。黑田 CFO 也会说明之后的出勤政策。', 'Our rating is back to 4.3. Next Thursday we will hold All Hands at the office. I want to thank each of you in person, and Kuroda will explain where the attendance policy goes from here.', 'アプリ評価は4.3まで戻りました。来週木曜、オフィスでAll Handsを開きます。一人ひとりに直接お礼を言いたい。黒田CFOから今後の出社方針の説明もあります。'),
      T('请尽量全员到场。', 'Please try to be there, everyone.', 'できるだけ全員の参加をお願いします。'),
    ],
  },
};

export const CHATS = {
  happy: { name: T('新办公室初体验', 'New office first look', '新オフィス初日'), channel: '#dev-2', msgs: [
    ['abe', T('新办公室的光线好适合拍照', 'The light in the new office is great for photos', '新オフィス、光がきれいで写真映えする')],
    ['wang', T('咖啡机确实不错', 'The coffee machine is legit', 'コーヒーマシンは確かにいい')],
    ['tanaka', T('佐藤さん带我逛了一圈，居然有午睡舱！', 'Sato gave me a tour. There are nap pods!', '佐藤さんに案内してもらいました。仮眠ポッドがある！')],
    ['kobayashi', T('一周来一次，刚刚好', 'Once a week feels just right', '週1回、ちょうどいいね')],
    ['suzuki', T('监控大屏装好了。下次见～', 'Monitoring wall is up. See you next time~', '監視モニター設置完了。またね〜')],
  ] },
  complain: { name: Z('出勤新政策'), channel: '#dev-2', msgs: [
    ['wang', Z('……2 天？')],
    ['kobayashi', Z('我把邮件看了三遍，还是 2 天')],
    ['wang', Z('我周末又要发版。周一周二就别指望我了')],
    ['suzuki', Z('大家知道我住在长野吧。新干线来回一趟 1.6 万，来一次最好多待两天')],
    ['abe', Z('办公室好吵。尤其是某人的青轴键盘……他来的日子我能不来吗')],
    ['tanaka', Z('我都可以！……就是一个人在办公室的时候，不知道该问谁')],
    ['sato', Z('我哪天都行，先按要求来吧。……周一早上我得先送我爸去医院就是了')],
    ['kobayashi', Z('我也会配合的。……就是周三下午有点那个')],
    ['wang', Z('我反正不想去')],
    ['suzuki', Z('+1')],
    ['abe', Z('+1')],
  ] },
  layoff: { name: Z('销售部的事'), channel: '#dev-2', msgs: [
    ['tanaka', Z('销售部的山本さん今天把桌子清空了……')],
    ['wang', Z('「其他部门暂无调整计划」。这句话我在三家公司都见过')],
    ['tanaka', Z('我这周有佐藤さん在的那天，问问题都不紧张了。可是天天黏着他好像也不太好……')],
    ['abe', Z('今天又是键盘交响乐的一天')],
    ['wang', Z('连着两天早起，我现在看代码是重影的')],
  ] },
  perks: { name: T('咖啡没了', 'No more coffee', 'コーヒーがない'), channel: '#dev-2', msgs: [
    ['abe', T('咖啡机还在，咖啡没了', 'The coffee machine stays. The coffee goes', 'マシンは残る。コーヒーは消える')],
    ['wang', T('你品，你细品', 'Let that sink in', '味わい深いね')],
    ['suzuki', T('长野到东京新干线往返 1.6 万日元。3 万日元只够我来一次。', 'Nagano–Tokyo round trip on the shinkansen is ¥16,000. ¥30,000 covers one visit.', '長野〜東京の新幹線往復で1.6万円。3万円だと1回分にしかならない。')],
    ['kobayashi', T('……那还要求每周来两次？', '...and they still want twice a week?', '……それで週2回来いって？')],
    ['suzuki', T('我算了一下，每个月要倒贴 10 万日元。', 'I did the math. I\'d be paying ¥100,000 a month out of pocket.', '計算したら毎月10万円の持ち出し。')],
  ] },
  reviews: { name: T('评分告急', 'Rating emergency', '評価がピンチ'), channel: '#general', msgs: [
    ['nakamura', T('大家看一下应用商店，评分从 4.6 掉到 2.1 了', 'Everyone, check the app store. Our rating dropped from 4.6 to 2.1', '皆さんアプリストアを見てください。評価が4.6から2.1に落ちています')],
    ['nakamura', T('「同步把我的笔记全删了」「更新后打不开」，一千多条', '"Sync deleted all my notes." "Won\'t open after the update." Over a thousand of these', '「同期でメモが全部消えた」「アップデート後に起動しない」が1000件以上')],
    ['wang', T('是周三那次发版。我在查。', "It's Wednesday's release. I'm on it.", '水曜のリリースだ。調べてる。')],
    ['sato', T('我来组织复盘。大家先修 bug。', "I'll run the postmortem. Everyone, fix first.", '振り返りは僕がやる。まずは修正を。')],
    ['kuroda', T('各位，稍后会发邮件。', 'Everyone, an email is coming shortly.', '皆さん、のちほどメールを送ります。')],
    ['abe', T('……我有不好的预感', '...I have a bad feeling about this', '……嫌な予感がする')],
  ] },
  thaw: { name: T('评分回来了', 'The rating is back', '評価が戻った'), channel: '#general', msgs: [
    ['nakamura', T('评分回到 4.3 了！🎉', 'Rating is back to 4.3! 🎉', '評価が4.3に戻りました！🎉')],
    ['nakamura', T('有用户说新的错误提示「意外地很温柔」', 'One user said the new error messages are "surprisingly kind"', '新しいエラーメッセージが「意外とやさしい」とレビューされてます')],
    ['abe', T('那是我和老王在办公室一起改的', 'Wang and I rewrote those together at the office', 'あれ、王さんとオフィスで一緒に直したやつ')],
    ['wang', T('用的是静音键盘', 'On a silent keyboard', '静音キーボードでね')],
  ] },
  ready: { name: T('All Hands 前夜', 'Night before All Hands', 'All Hands前夜'), channel: '#dev-2', msgs: [
    ['kobayashi', T('周四我去，孩子拜托给婆婆了', "I'll be there Thursday. Grandma has the kids", '木曜は行くよ。子どもは義母にお願いした')],
    ['suzuki', T('周三、周四的酒店订好了', 'Hotel booked for Wednesday and Thursday', '水・木のホテル取れた')],
    ['tanaka', T('我可以坐在佐藤さん旁边吗', 'Can I sit next to Sato?', '佐藤さんの隣に座っていいですか')],
    ['sato', T('可以', 'Sure', 'いいよ')],
    ['wang', T('这周我连着来也行。为了合影。', "I'll do back-to-back days this week. For the photo.", '今週は連続でも行く。集合写真のために。')],
  ] },
};

export const TALKS = {
  kobayashi: {
    lines: [
      ['them', Z('你找我？是出勤的事吧。')],
      ['me', Z('嗯。新政策下来了，我想先听听你的想法。')],
      ['them', Z('……我会配合的。公司的决定嘛。')],
      { choice: [
        { tag: 'empathy', label: Z('「配合」听起来有点勉强。有什么不方便的，可以直接跟我说。'), reply: [
          ['them', Z('……你真想听？')],
          ['them', Z('我家两个孩子，幼儿园下午四点就关门。从公司赶回去要一个小时。')],
        ] },
        { tag: 'solve', label: Z('那你申请想哪几天来，我尽量按申请排。'), reply: [
          ['them', Z('好，我填了周三和周四。')],
          ['them', Z('（她停了一下）……没事，就这两天吧。')],
        ] },
        { tag: 'wild', label: Z('要不我们把办公室搬到你家楼下？'), reply: [
          ['them', Z('（笑）那房租 CFO 会先把你开了。')],
          ['them', Z('不过……要是离家近一点就好了。孩子的事总是突然冒出来。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('孩子平时是谁去接？'), reply: [
          ['them', Z('一般是我。周三最麻烦，幼儿园三点就放学，还要赶游泳课。')],
        ] },
        { tag: 'solve', label: Z('那你那几天尽量早点走就好。'), reply: [
          ['them', Z('早点走……也不是每天都走得开。算了，我再想想办法。')],
        ] },
        { tag: 'wild', label: Z('我可以给你做一个接孩子的机器人。'), reply: [
          ['them', Z('老王应该会很感兴趣。……其实一周里最难的就是周三，三点就得到幼儿园。')],
        ] },
      ] },
      ['them', Z('不管怎样，申请我就先那么填了。你看着排吧。')],
      { ask: {
        options: [
          { text: Z('周三必须在家'), ok: true },
          { text: Z('每周最多只能来 1 天') },
          { text: Z('一定要按申请的周三、周四来') },
          { text: Z('必须和佐藤同一天来') },
        ],
        right: [['me', Z('周三你就在家吧。申请上写的周三，我不会排。')], ['them', Z('……你听出来了啊。谢谢。其实我填周三，是怕被说不配合。')]],
        wrong: [['them', Z('……嗯，好。')], ['them', Z('（她没再多说什么）')]],
      } },
    ],
  },
  wang: {
    lines: [
      ['them', Z('你是来劝我去公司的吧。')],
      ['me', Z('我是来听你说的。')],
      ['them', Z('没什么好说的，排就排呗。')],
      { choice: [
        { tag: 'empathy', label: Z('上周你看起来挺累的。'), reply: [
          ['them', Z('周末又发版，周日凌晨四点才睡。周一早上？别想了。')],
        ] },
        { tag: 'solve', label: Z('那你申请的那两天，我给你排上？'), reply: [
          ['them', Z('随便。……反正排哪天我都是僵尸。')],
        ] },
        { tag: 'wild', label: Z('在办公室装个吊床？白天你睡，晚上写代码。'), reply: [
          ['them', Z('总务部会先把你裁了。')],
          ['them', Z('……不过你说到点子上了：问题在时间，不在地点。周一早上尤其不行。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('那连着两天来，会怎么样？'), reply: [
          ['them', Z('来一天还行，第二天作息就全乱了。中间隔一天，我就能缓过来。')],
        ] },
        { tag: 'solve', label: Z('那就多喝点咖啡吧。'), reply: [
          ['them', Z('咖啡？听说总务部要停了。')],
        ] },
        { tag: 'wild', label: Z('我们把周一改名叫周二怎么样？'), reply: [
          ['them', Z('（笑）那我的周日就更短了。……其实只要别让我连着两天来，中间隔一天就行。')],
        ] },
      ] },
      ['them', Z('这周机房要换硬盘，我总得去一天。其他的，你看着办。')],
      { ask: {
        options: [
          { text: Z('周一在家，而且不连续两天出社'), ok: true },
          { text: Z('只上夜班') },
          { text: Z('不和阿部同一天出社') },
          { text: Z('每周只来周三') },
        ],
        right: [['me', Z('周一你在家，来的日子我也会隔开排。')], ['them', Z('……行。那我尽量不在群里抱怨了。')]],
        wrong: [['them', Z('……随你。')]],
      } },
    ],
  },
  suzuki: {
    lines: [
      ['them', T('先说好，我不是不想见大家。', 'Just so you know, it\'s not that I don\'t want to see everyone.', '先に言っておくと、みんなに会いたくないわけじゃないんだ。')],
      ['them', T('疫情的时候公司说可以全远程，我才搬回长野照顾父母。现在新干线的钱都不报了。', 'During the pandemic the company said full remote was fine, so I moved back to Nagano to look after my parents. Now they won\'t even cover the shinkansen.', 'コロナのとき会社がフルリモートOKって言ったから、親の面倒を見に長野に戻った。今は新幹線代も出ない。')],
      ['me', T('嗯。你搬家是公司同意过的。', 'Right. The company signed off on that move.', 'うん。引っ越しは会社も認めてた。')],
      { choice: [
        { label: T('你连续来两天，中间住一晚，我去申请出差住宿补贴。', 'Come two days in a row, stay one night, and I\'ll get it approved as a business trip.', '2日連続で来て1泊する形にしよう。出張として宿泊手当を申請する。'), reply: [
          ['them', T('住宿算出差的话……一趟就能办两天的事。', 'If the hotel counts as a business trip... one trip covers two days.', '宿泊が出張扱いなら……1往復で2日分こなせる。')],
        ] },
        { label: T('干脆在长野开个分公司？你当分公司社长。', 'Why not open a Nagano branch? You can be branch president.', 'いっそ長野支社を作ろう。君が支社長だ。'), reply: [
          ['them', T('（笑）社长兼保洁兼 SRE？', '(laughs) President, janitor and SRE?', '（笑）支社長兼清掃兼SRE？')],
          ['them', T('其实……一次来两天就好，中间住一晚。', 'Honestly... two days per trip would do it. One night in between.', '実は……1回で2日来られればいい。間に1泊して。')],
          ['me', T('那我去申请出差住宿补贴，按出差算。', "Then I'll file the hotel as a business trip.", 'じゃあ出張扱いで宿泊手当を申請するね。')],
        ] },
      ] },
      ['them', T('行，我会连着来两天。父母那边我安排一下。', "Okay. I'll come two days back-to-back. I'll sort things out with my parents.", 'わかった、2日連続で行く。親のほうは調整する。')],
    ],
    unlock: { before: T('周一、周二 不想来', 'Mon, Tue: not coming', '月・火 行きたくない'), after: T('出社日必须连在一起（出差住宿补贴）', 'Office days must be back-to-back (hotel allowance)', '出社日は連続（出張宿泊手当）') },
  },
  tanaka: {
    lines: [
      ['them', T('对不起……我最近把日历都锁了。', "I'm sorry... I've locked my whole calendar lately.", 'すみません……最近カレンダーを全部ロックしてて。')],
      ['me', T('不用道歉。发生什么了吗？', 'No need to apologize. What happened?', '謝らなくていいよ。何かあった？')],
      ['them', T('销售部的事之后，我在办公室总觉得大家在看我。我什么都不会，问问题又怕被觉得没用。', "Since the Sales thing, I feel like everyone's watching me at the office. I don't know anything, and I'm scared asking questions makes me look useless.", '営業部のことがあってから、オフィスでずっと見られてる気がして。何もできないし、質問したら使えないと思われそうで。')],
      ['them', T('在家的话，至少可以偷偷 Google。', 'At home I can at least Google things quietly.', '家ならこっそりググれるので。')],
      { choice: [
        { label: T('那每周有几天跟佐藤一起来吧，那几天有问题直接问他。他是你的导师。', 'Then share a few office days with Sato each week, and ask him anything on those days. That\'s what a mentor is for.', '毎週何日かは佐藤さんと一緒に来よう。その日は何でも聞けばいい。メンターなんだから。'), reply: [
          ['them', T('佐藤さん在的话……我应该敢问。', 'If Sato is there... I think I could ask.', '佐藤さんがいれば……聞けると思います。')],
        ] },
        { label: T('我给你做个「问题扭蛋机」，问一个问题出一颗糖？', 'I\'ll build you a question gacha machine. One question, one candy.', '「質問ガチャ」を作ろう。1回質問したら飴が1個出る。'), reply: [
          ['them', T('那我会胖 10 公斤的……', "I'd gain ten kilos...", '10キロ太っちゃいます……')],
          ['them', T('不过，要是有个人可以随便问，我应该会好很多。', 'But if there were someone I could just ask, that would help a lot.', 'でも、気軽に聞ける人がいたら、だいぶ違うと思います。')],
          ['me', T('那每周有几天跟佐藤一起来。他是你的导师。', "Then share a few office days with Sato each week. He's your mentor.", 'じゃあ毎週何日かは佐藤さんと一緒に来よう。メンターだし。')],
        ] },
      ] },
      ['them', T('佐藤さん说过，他当新人的时候也问过「git 是什么」。', 'Sato once told me that as a new grad, he asked "what is git?"', '佐藤さん、新人のころ「gitって何ですか」って聞いたって言ってました。')],
    ],
    unlock: { before: T('周四、周五 不想来', 'Thu, Fri: not coming', '木・金 行きたくない'), after: T('和佐藤固定有几天一起出社', 'Shares a set number of office days with Sato', '佐藤さんと決まった日数だけ一緒に出社') },
  },
  abe: {
    lines: [
      ['them', T('你知道办公室为什么吵吗？', 'Do you know why the office is so loud?', 'オフィスがなんでうるさいか知ってる？')],
      ['me', T('……老王的键盘？', "...Wang's keyboard?", '……王さんのキーボード？')],
      ['them', T('机械键盘，青轴。他一紧张就打得更快。现在全公司都很紧张。', 'Mechanical, clicky blue switches. He types faster when he\'s stressed. And right now everyone is stressed.', 'メカニカル、青軸。焦るとタイピングが速くなる。で、今は全社が焦ってる。')],
      ['them', T('做设计要安静。在那种声音里，我画的按钮都像在尖叫。', 'I need quiet to design. In that noise, every button I draw looks like it\'s screaming.', 'デザインには静けさが要る。あの音の中だと、描くボタンが全部叫んでるみたいになる。')],
      { choice: [
        { label: T('我给你申请降噪耳机，再把你们俩的排班错开。', "I'll get you noise-cancelling headphones and keep your days apart from his.", 'ノイキャンのヘッドホンを申請して、王さんとはシフトをずらすよ。'), reply: [
          ['them', T('完全错开也不行，有些接口必须和他当面对……', 'Not completely apart, though. Some APIs I have to go over with him in person...', '完全にずらすのも困る。APIの仕様は直接すり合わせたいし……')],
        ] },
        { label: T('我去把老王的键盘换成电子琴，至少好听一点。', "I'll swap Wang's keyboard for a piano keyboard. At least it'll sound nice.", '王さんのキーボードを電子ピアノに替えよう。少なくとも音はきれい。'), reply: [
          ['them', T('（笑）那他会开始弹肖邦。', "(laughs) Then he'd start playing Chopin.", '（笑）ショパンを弾き始めるよ。')],
          ['them', T('说真的，偶尔一起在比较好，有些接口要当面对。', "Honestly, being in together sometimes is good. Some APIs need a face-to-face.", '真面目に言うと、たまに一緒にいるのはいいんだ。APIは直接すり合わせたい。')],
        ] },
      ] },
      ['me', T('那就一周只有一天和老王同时在，那天专门对接口。', 'So one day a week with Wang, and that day is for API work.', 'じゃあ王さんと一緒の日は週1日だけ。その日はAPIのすり合わせ。')],
      ['them', T('成交。再加一副降噪耳机。', 'Deal. Plus the headphones.', '決まり。ヘッドホンもね。')],
    ],
    unlock: { before: T('周四 不想来', 'Thu: not coming', '木 行きたくない'), after: T('和老王恰好 1 天同时出社', 'Exactly 1 office day together with Wang', '王さんと同じ日の出社はちょうど1日') },
  },
  sato: {
    lines: [
      ['me', T('佐藤さん，你的日历最近也锁了。', 'Sato, your calendar is locked too these days.', '佐藤さん、最近カレンダーがロックされてますね。')],
      ['them', T('……被你发现了。', '...You noticed.', '……バレたか。')],
      ['them', T('事故以后，我每天复盘到 11 点，周末也在。一来办公室，大家都来问我。被需要我很高兴，可我一行代码都写不了。', "Since the incident I've been doing postmortems until 11 every night, weekends too. When I'm in the office everyone comes to me. I like being needed, but I can't write a single line of code.", '障害以来、毎晩23時まで振り返り、週末も。オフィスに行けばみんなが質問に来る。頼られるのは嬉しいけど、1行もコードが書けない。')],
      ['them', T('当初是我第一个说「先按要求来吧」。我不想第一个说不行。', 'I was the first one to say "let\'s follow the policy." I didn\'t want to be the first to say I can\'t.', '最初に「ルール通りにやろう」と言ったのは僕だから。最初に「無理」とは言いたくなかった。')],
      { choice: [
        { label: T('每周五固定在家，那天谁都不许找你，包括我。', 'Fridays are yours, at home. No one contacts you that day. Including me.', '金曜は在宅固定。その日は誰も連絡しない。私も含めて。'), reply: [
          ['them', T('包括你？', 'Including you?', '君も？')],
          ['me', T('包括我。', 'Including me.', '私も。')],
        ] },
        { label: T('做一个佐藤的纸板立牌放在办公室，让大家去问它。', "Let's put a cardboard cutout of you in the office. People can ask it instead.", '佐藤さんの等身大パネルをオフィスに置こう。質問はパネルにしてもらう。'), reply: [
          ['them', T('田中大概真的会去问它。', 'Tanaka would actually ask it.', '田中くんは本当にパネルに聞くと思う。')],
          ['them', T('……其实我只需要一天，安安静静地写代码。', '...Honestly, I just need one quiet day to write code.', '……本当は、静かにコードを書ける日が1日あればいい。')],
          ['me', T('那每周五固定在家，谁都不许找你，包括我。', 'Then Fridays at home. No one contacts you. Including me.', 'じゃあ金曜は在宅固定。誰も連絡しない。私も含めて。')],
        ] },
      ] },
      ['them', T('谢谢。这是我这个月第一次觉得能喘口气。', 'Thank you. That\'s the first time this month I feel like I can breathe.', 'ありがとう。今月初めて息ができる気がする。')],
    ],
    unlock: { before: T('周三 不想来', 'Wed: not coming', '水 行きたくない'), after: T('周五在家（深度工作日）', 'Home on Friday (deep-work day)', '金曜在宅（集中作業日）') },
  },
};

export const FINALE = [
  ['kuroda', T('上个月的出勤率是 60%，达到了目标。', 'Attendance last month was 60%. Target met.', '先月の出社率は60%。目標達成です。')],
  ['kuroda', T('不过说实话，我在作战室里看到的东西，比这个数字更有意义。', 'But to be honest, what I saw in the war room meant more to me than that number.', 'ただ正直に言うと、作戦室で見たもののほうが、この数字より意味がありました。')],
  ['kuroda', T('从下个月起，出勤天数由各团队自己决定。', 'Starting next month, each team decides its own office days.', '来月から、出社日数は各チームで決めてください。')],
  ['mori', T('既然今天大家都在，开发二组，来拍张合影吧！', "Since everyone's here today, Dev Team 2, let's take a group photo!", 'せっかく全員そろったし、開発2課、集合写真を撮ろう！')],
];

export const MOOD_LINES = {
  kobayashi: { happy: Z('这周按时接到孩子了，谢谢🙏'), meh: Z('周三被排进来了……婆婆帮忙接的孩子，下次不一定行'), angry: Z('这周排的日子我都走不开。我再想想办法吧') },
  sato: { happy: Z('我哪天都行，这周也挺顺'), meh: Z('嗯，还行'), angry: Z('……这周有点累') },
  tanaka: { happy: Z('佐藤さん在的那天，我问了好多问题！'), meh: Z('今天一个人在办公室，不知道该问谁……'), angry: Z('这周我好像一直是一个人……') },
  wang: { happy: Z('这周作息没崩，难得'), meh: Z('周一早上来的……我现在看代码是重影的'), angry: Z('连着两天来，我已经不知道今天星期几了') },
  abe: { happy: Z('这周耳根清净，图画得特别顺'), meh: Z('旁边一直有键盘声……算了'), angry: Z('青轴键盘陪了我一整天') },
  suzuki: { happy: Z('这周一趟新干线办完两天的事，划算'), meh: Z('这周跑了两趟长野和东京，有点累'), angry: Z('新干线来回两趟，这个月的交通费已经超了……') },
};

const failed = n => S => S.fails >= n;
export const BEATS = [
  ['email:welcome'],
  ['chat:happy', 'email:cfo', ['email:remind', failed(1)], 'chat:complain', 'talk:kobayashi'],
  ['chat:mood1', ['email:remind', failed(1)], ['email:warn', failed(2)], 'email:layoff', 'chat:layoff', 'talk:wang'],
  ['chat:mood2', ['email:remind', failed(1)], ['email:warn', failed(2)]],
];
