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
  fired: {
    from: 'kuroda', date: T('周五 18:30', 'Fri 18:30', '金曜 18:30'),
    to: T('开发二组经理', 'Dev Team 2 manager', '開発2課マネージャー'),
    subject: T('关于开发二组经理一职', 'About the Dev Team 2 manager role', '開発2課マネージャー職について'),
    body: [
      T('出勤率第三次没有达到目标。', 'Attendance has missed the target for the third time.', '出社率の目標未達は、これで3回目です。'),
      T('明天起，开发二组由其他人接手。工位上的私人物品请在本周内带走。', 'Starting tomorrow, someone else will run Dev Team 2. Please clear your personal belongings from your desk by the end of the week.', '明日から開発2課は別の者が担当します。デスクの私物は今週中に片付けてください。'),
      T('黑田', 'Kuroda', '黒田'),
    ],
    restart: true,
  },
  shutdown: {
    from: 'mori', date: T('周五 19:00', 'Fri 19:00', '金曜 19:00'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('关于产品的重要通知', 'An important notice about our product', 'プロダクトに関する重要なお知らせ'),
    body: [
      T('各位：', 'Hi everyone,', '皆さま'),
      T('很遗憾通知大家，过去两个月我们没能把评分拉回来。作战室的最后一周，大家已经尽了全力，但修复没能赶上。', 'I am sorry to tell you that we could not bring the rating back over the past two months. Everyone gave it everything in the last war-room week, but the fix did not make it in time.', '残念なお知らせです。この2か月、評価を取り戻すことはできませんでした。作戦室の最後の週、皆さんは全力を尽くしてくれましたが、修正は間に合いませんでした。'),
      T('经董事会决定，公司将在月底关闭这个产品，相关团队随之解散。后续安排，人事部会逐一和大家沟通。', 'The board has decided to shut the product down at the end of the month, and the teams behind it will be disbanded. The People Team will talk with each of you about what comes next.', '取締役会の決定により、本プロダクトは月末で終了し、関連チームは解散となります。今後については人事部から個別にご連絡します。'),
      T('谢谢每一位的付出。', 'Thank you, every one of you.', '一人ひとりの尽力に、心から感謝します。'),
    ],
    ps: T('PS：新办公室的咖啡机将捐给附近的大学。', 'PS: The coffee machine in the new office will be donated to a nearby university.', '追伸：新オフィスのコーヒーマシンは近くの大学に寄贈します。'),
    restart: true,
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
    from: 'hr', date: T('10月23日 周五 17:30', 'Fri, Oct 23 · 17:30', '10月23日(金) 17:30'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('组织调整通知', 'Organizational Changes', '組織変更のお知らせ'),
    body: [
      T('为提升经营效率，销售部将进行组织调整，涉及约 30% 的岗位。相关同事已单独通知。', 'To improve efficiency, we are restructuring Sales, affecting about 30% of roles. Those affected have been notified individually.', '経営効率化のため、営業部の組織再編を行います。対象は約30%の職務で、該当者には個別に連絡済みです。'),
      T('下周 3 楼会议室将用于面谈。', '3F meeting rooms will be used for interviews next week.', '来週、3階会議室は面談に使用します。'),
      T('其他部门暂无调整计划。', 'There are currently no plans for other departments.', 'その他の部門について現時点で計画はありません。'),
    ],
  },
  perks: {
    from: 'ga', date: T('10月30日 周五 12:00', 'Fri, Oct 30 · 12:00', '10月30日(金) 12:00'),
    to: T('全体员工', 'All staff', '全社員'),
    subject: T('福利制度调整', 'Changes to Employee Benefits', '福利厚生の見直しについて'),
    body: [
      T('自即日起：', 'Effective immediately:', '本日より以下の通り変更します。'),
      T('① 办公室免费咖啡停止提供（咖啡机保留）；② 通勤交通费每月上限调整为 3 万日元；③ 取消年末聚会预算；④ 办公区分区照明以节省电费。', '(1) Free office coffee is discontinued (the machine stays); (2) commuting allowance is capped at ¥30,000/month; (3) the year-end party budget is cancelled; (4) office lighting will be zoned to save power.', '①オフィスの無料コーヒーを終了（マシンは残します）②通勤手当の上限を月3万円に変更 ③忘年会予算の廃止 ④節電のためエリア別消灯を実施。'),
      T('感谢各位理解。', 'Thank you for understanding.', 'ご理解のほどよろしくお願いします。'),
    ],
  },
  warroom: {
    from: 'kuroda', date: T('11月13日 周五 21:15', 'Fri, Nov 13 · 21:15', '11月13日(金) 21:15'),
    to: T('开发部门全体', 'All Engineering', '開発部門全員'),
    subject: T('紧急：线下作战体制', 'URGENT: In-Office War Room', '【緊急】出社による対策体制について'),
    body: [
      T('鉴于产品评分急剧下滑，开发部门自下周起每周出社 3 天，直至应用评分恢复到 4.0 以上。', 'Given the sharp drop in our app rating, Engineering will work from the office 3 days a week starting next week, until the rating is back above 4.0.', 'アプリ評価の急落を受け、開発部門は来週より評価が4.0以上に回復するまで週3日出社とします。'),
      T('危机时刻，更需要面对面沟通。', 'In a crisis, we need to talk face to face.', '危機のときこそ対面でのコミュニケーションが必要です。'),
      T('各团队出勤率改为每日公示。', 'Team attendance will now be published daily.', 'チーム別出社率は毎日公開に変更します。'),
    ],
  },
  deadline: {
    from: 'mori', date: Z('12月4日 周五 22:40'),
    to: Z('开发部门全体'),
    subject: Z('下周五'),
    body: [
      Z('评分现在是 3.4。投资方说，如果下周五之前回不到 4.0，下一轮就不投了。'),
      Z('我知道大家已经连着三周每周来三天，很多人很累。'),
      Z('我能做的只有相信你们。也请各位经理，照顾好自己的人。'),
      Z('森'),
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
  happy: { name: Z('新办公室初体验'), channel: '#dev-2', msgs: [
    ['abe', Z('新办公室的光线好适合拍照')],
    ['wang', Z('咖啡机确实不错。就是早上九点的电车人太多了')],
    ['tanaka', Z('佐藤さん带我逛了一圈，居然有午睡舱！')],
    ['sato', Z('午睡舱是给老王准备的')],
    ['wang', Z('……我不否认')],
    ['kobayashi', Z('一周来一次刚刚好，不用麻烦婆婆接孩子')],
    ['suzuki', Z('监控大屏装好了。这次坐的是早上六点的新干线，困死')],
    ['abe', Z('铃木さん辛苦了。下次来住一晚吧，附近有家不错的拉面')],
    ['suzuki', Z('住一晚的话……一趟待两天倒是划算')],
    ['tanaka', Z('下周还能见到大家吗？')],
    ['kobayashi', Z('看 HQ 怎么说吧')],
  ] },
  complain: { name: Z('出勤新政策'), channel: '#dev-2', msgs: [
    ['wang', Z('……2 天？')],
    ['kobayashi', Z('我把邮件看了三遍，还是 2 天')],
    ['abe', Z('「出勤率纳入经理考核」。懂了，是新经理的 KPI')],
    ['wang', Z('我周末又要发版。周一周二就别指望我了')],
    ['suzuki', Z('大家知道我住在长野吧。新干线来回一趟 1.6 万，来一次最好多待两天')],
    ['abe', Z('办公室好吵。尤其是某人的青轴键盘……他来的日子我能不来吗')],
    ['wang', Z('青轴怎么了，青轴是信仰')],
    ['tanaka', Z('我都可以！……就是一个人在办公室的时候，不知道该问谁')],
    ['sato', Z('我哪天都行，先按要求来吧。……周一早上我得先送我爸去医院就是了')],
    ['tanaka', Z('佐藤さん在的话我就放心了。不过也不好意思每天都黏着您……')],
    ['kobayashi', Z('我也会配合的。……就是周三下午有点那个')],
    ['abe', Z('那个是哪个？')],
    ['kobayashi', Z('没什么，我会想办法的')],
    ['wang', Z('我反正不想去')],
    ['suzuki', Z('+1')],
    ['abe', Z('+1')],
  ] },
  layoff: { name: Z('销售部的事'), channel: '#dev-2', msgs: [
    ['tanaka', Z('销售部的山本さん今天把桌子清空了……')],
    ['abe', Z('我看到了，纸箱里还有他女儿画的画')],
    ['wang', Z('「其他部门暂无调整计划」。这句话我在三家公司都见过')],
    ['sato', Z('别乱想，先把手上的事做好')],
    ['tanaka', Z('有佐藤さん在的那天，我问问题都不紧张了。可是天天黏着他好像也不太好……')],
    ['abe', Z('今天又是键盘交响乐的一天')],
    ['wang', Z('我已经换成静音的那块了')],
    ['abe', Z('静音的也是青轴改的吧')],
    ['wang', Z('……被你发现了。说真的，要是连着两天早起，我看代码会是重影的')],
    ['suzuki', Z('我在新干线上把告警都处理完了。要是一趟能待两天就好了')],
    ['kobayashi', Z('大家注意身体。……我先下线了，三点要到幼儿园')],
  ] },
  perks: { name: Z('咖啡没了'), channel: '#dev-2', msgs: [
    ['abe', Z('咖啡机还在，咖啡没了')],
    ['wang', Z('你品，你细品')],
    ['kobayashi', Z('年末聚会也取消了……孩子们还说想见见大家')],
    ['tanaka', Z('我带了挂耳包，大家要的话在我抽屉里')],
    ['sato', Z('田中，谢谢。不过你自己也留几包')],
    ['suzuki', Z('交通费上限 3 万日元。长野到东京新干线往返 1.6 万。')],
    ['kobayashi', Z('……那还要求每周来两次？')],
    ['suzuki', Z('我算了一下，一个月要倒贴将近 10 万日元。')],
    ['suzuki', Z('来一次待两天的话，就只要一趟车钱。可是住一晚的酒店又得自己掏')],
    ['abe', Z('分区熄灯也开始了。我那排下午四点就黑了')],
    ['wang', Z('正好，我可以在黑暗里敲键盘')],
    ['abe', Z('你敢')],
  ] },
  reviews: { name: Z('评分告急'), channel: '#general', msgs: [
    ['nakamura', Z('大家看一下应用商店，评分从 4.6 掉到 2.1 了')],
    ['nakamura', Z('「同步把我的笔记全删了」「更新后打不开」，一千多条')],
    ['wang', Z('是周三那次发版。迁移脚本在旧版本上跑了两遍。我在查。')],
    ['sato', Z('我来组织复盘。大家先修 bug。')],
    ['abe', Z('错误提示也得重写，现在用户看到的是一串英文代码')],
    ['abe', Z('……文案和接口得跟老王当面对。远程对了三次，三次都对错了')],
    ['kuroda', Z('各位，稍后会发邮件。')],
    ['tanaka', Z('……我有不好的预感')],
    ['suzuki', Z('监控我盯着。今晚不睡了')],
    ['kobayashi', Z('客户那边我去道歉。你们专心修')],
  ] },
  thaw: { name: Z('评分回来了'), channel: '#general', msgs: [
    ['nakamura', Z('评分回到 4.3 了！🎉')],
    ['nakamura', Z('有用户说新的错误提示「意外地很温柔」')],
    ['abe', Z('那是我和老王在办公室一起改的')],
    ['wang', Z('用的是静音键盘')],
    ['abe', Z('……这次是真的静音的')],
    ['sato', Z('复盘文档我整理完了。田中写了其中一节')],
    ['tanaka', Z('是、是最短的那一节……')],
    ['suzuki', Z('这周一次告警都没有。我想去睡一觉')],
    ['kobayashi', Z('辛苦了，各位。周三我请大家吃点心，寄到你们家里')],
  ] },
  ready: { name: Z('All Hands 前夜'), channel: '#dev-2', msgs: [
    ['kobayashi', Z('周四我去，孩子拜托给婆婆了')],
    ['suzuki', Z('周三、周四的酒店订好了。这次算出差')],
    ['tanaka', Z('我可以坐在佐藤さん旁边吗')],
    ['sato', Z('可以。这次不复盘，只吃饭')],
    ['wang', Z('这周我连着来也行。为了合影。')],
    ['abe', Z('那你周一呢')],
    ['wang', Z('周一照样补觉。我又不是变了一个人')],
    ['abe', Z('那我带降噪耳机去合影')],
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
          ['them', Z('好，我填了周一和周二。')],
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
          { text: Z('每天下午三点前就得下班') },
          { text: Z('周四必须在家') },
          { text: Z('一定要按申请的周一、周二来') },
        ],
        right: [['me', Z('周三你就在家吧。申请上写的周三，我不会排。')], ['them', Z('……你听出来了啊。谢谢。其实我一直怕被说不配合，所以申请里一个字都没提。')]],
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
          { text: Z('只想上夜班') },
          { text: Z('一周最多只来一天') },
          { text: Z('一定要按申请的日子来') },
        ],
        right: [['me', Z('周一你在家，来的日子我也会隔开排。')], ['them', Z('……行。那我尽量不在群里抱怨了。')]],
        wrong: [['them', Z('……随你。')]],
      } },
    ],
  },
  suzuki: {
    lines: [
      ['them', Z('先说好，我不是不想见大家。')],
      ['them', Z('疫情的时候公司说可以全远程，我才搬回长野照顾父母。现在交通费有了上限，新干线来回一趟就是 1.6 万。')],
      ['me', Z('嗯。你搬家是公司同意过的。')],
      { choice: [
        { tag: 'empathy', label: Z('每周跑两趟东京，身体吃得消吗？'), reply: [
          ['them', Z('早上五点起，赶六点的新干线。晚上回去还要照顾我妈。')],
          ['them', Z('说实话，跑两趟是最累的。来一趟能多待一天就好了。')],
        ] },
        { tag: 'solve', label: Z('那你申请的那两天，我都给你排上。'), reply: [
          ['them', Z('……好啊。')],
          ['them', Z('（他在手机上算着什么）嗯，没事。')],
        ] },
        { tag: 'wild', label: Z('干脆在长野开个分公司？你当分公司社长。'), reply: [
          ['them', Z('（笑）社长兼保洁兼 SRE？')],
          ['them', Z('……其实不用那么麻烦。一趟车能待两天，路费就省一半。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('那待两天的话，晚上住哪？'), reply: [
          ['them', Z('自己找酒店，自己掏钱。……要是能算出差就好了。')],
        ] },
        { tag: 'solve', label: Z('那你在新干线上尽量把活干完？'), reply: [
          ['them', Z('告警我已经在新干线上处理了。问题不是干活，是一趟 1.6 万。')],
        ] },
        { tag: 'wild', label: Z('我去跟总务部说，新干线算团建。'), reply: [
          ['them', Z('总务部会说，咖啡都停了还团建？')],
          ['them', Z('（笑）我只要两天连着就行，中间住一晚。')],
        ] },
      ] },
      ['them', Z('父母那边我会安排。你看着排吧。')],
      { ask: {
        options: [
          { text: Z('出社日要连在一起'), ok: true },
          { text: Z('一周只能来一天') },
          { text: Z('只能周五来') },
          { text: Z('一定要按申请的日子来') },
        ],
        right: [['me', Z('你来的两天我排在一起，中间那晚我去申请出差住宿补贴。')], ['them', Z('……那就一趟新干线办两天的事。谢谢。')]],
        wrong: [['them', Z('……嗯，行吧。')], ['them', Z('（他关掉了摄像头）')]],
      } },
    ],
  },
  tanaka: {
    lines: [
      ['them', Z('对不起……我最近总是想在家。')],
      ['me', Z('不用道歉。最近怎么样？')],
      ['them', Z('销售部的事之后，我在办公室总觉得大家在看我。问问题又怕被觉得没用。')],
      { choice: [
        { tag: 'empathy', label: Z('在办公室的时候，最难受的是什么？'), reply: [
          ['them', Z('一个人坐在那里，卡住了也不知道问谁。')],
          ['them', Z('佐藤さん在的时候就不一样，他会自己走过来看。')],
        ] },
        { tag: 'solve', label: Z('那你申请的日子我都排上，多来几次就习惯了。'), reply: [
          ['them', Z('……嗯。')],
          ['them', Z('（他低头看着键盘）多来几次……就会好吗。')],
        ] },
        { tag: 'wild', label: Z('我给你做个「问题扭蛋机」，问一个问题出一颗糖？'), reply: [
          ['them', Z('那我会胖 10 公斤的……')],
          ['them', Z('不过，要是佐藤さん在旁边，我应该敢问。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('那每天都跟佐藤一起来？'), reply: [
          ['them', Z('每天都跟着他……他会烦的吧。')],
          ['them', Z('而且我也想试试自己行不行。一周有一天就够了。')],
        ] },
        { tag: 'solve', label: Z('那你在家多看看文档吧。'), reply: [
          ['them', Z('文档我都看过了……看不懂的地方才想问人。')],
          ['them', Z('攒一周的问题，找一天问佐藤さん，应该就够了。')],
        ] },
        { tag: 'wild', label: Z('要不我们给佐藤做个纸板立牌？'), reply: [
          ['them', Z('（笑）那我可能真的会去问它。')],
          ['them', Z('……其实一周有一天佐藤さん在就好，其他日子我想自己试试。')],
        ] },
      ] },
      ['them', Z('佐藤さん说过，他当新人的时候也问过「git 是什么」。')],
      { ask: {
        options: [
          { text: Z('和佐藤恰好有 1 天一起出社'), ok: true },
          { text: Z('每天都要和佐藤一起出社') },
          { text: Z('办公室里至少要有 3 个人他才肯来') },
          { text: Z('一定要按申请的日子来') },
        ],
        right: [['me', Z('每周排一天你和佐藤一起，那天攒着问题问他。其他日子你自己试试。')], ['them', Z('……好。我会把问题记在本子上。')]],
        wrong: [['them', Z('……好的，我会努力的。')], ['them', Z('（他的声音越来越小）')]],
      } },
    ],
  },
  abe: {
    lines: [
      ['them', Z('你知道办公室为什么吵吗？')],
      ['me', Z('……老王的键盘？')],
      ['them', Z('青轴。他一紧张就打得更快。现在全公司都很紧张。')],
      ['them', Z('可作战室一开，错误提示的文案和接口都得跟他对。远程对了三次，三次都对错了。')],
      { choice: [
        { tag: 'empathy', label: Z('所以你其实需要跟他见面？'), reply: [
          ['them', Z('……一周见一次就够。')],
          ['them', Z('见多了，我的耳朵受不了。')],
        ] },
        { tag: 'solve', label: Z('那就把你们俩排在同一天，越多越好。'), reply: [
          ['them', Z('越多越好？')],
          ['them', Z('（她沉默了三秒）你是想让我画的按钮都尖叫吗。')],
        ] },
        { tag: 'wild', label: Z('我去把老王的键盘换成电子琴。'), reply: [
          ['them', Z('（笑）那他会开始弹肖邦。')],
          ['them', Z('……说真的，接口必须当面对。一周一天就好。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('那其他日子呢？'), reply: [
          ['them', Z('其他日子我想离那个键盘远一点。在家画图最快。')],
        ] },
        { tag: 'solve', label: Z('我给你申请一副降噪耳机。'), reply: [
          ['them', Z('耳机我有。戴一整天耳朵疼。')],
          ['them', Z('一周一天的话，我可以忍。')],
        ] },
        { tag: 'wild', label: Z('要不你们俩用摩斯电码沟通？'), reply: [
          ['them', Z('他会用青轴敲给我。')],
          ['them', Z('……一周就一天，对完接口我就回家。')],
        ] },
      ] },
      ['them', Z('降噪耳机还是要的。')],
      { ask: {
        options: [
          { text: Z('和老王恰好 1 天同时出社'), ok: true },
          { text: Z('永远不和老王同一天出社') },
          { text: Z('每次出社都要和老王一起') },
          { text: Z('一定要按申请的日子来') },
        ],
        right: [['me', Z('每周排一天你和老王一起，那天专门对接口。其他日子错开。')], ['them', Z('成交。再加一副降噪耳机。')]],
        wrong: [['them', Z('……行吧。')], ['them', Z('（她把耳机戴上了）')]],
      } },
    ],
  },
  sato: {
    lines: [
      ['me', Z('佐藤さん，最近还好吗？')],
      ['them', Z('……还好。')],
      ['them', Z('我爸的复健上周结束了，周一终于不用跑医院了。')],
      ['them', Z('只是事故以后，我每天复盘到 11 点，周末也在。一来办公室，大家都来问我。被需要我很高兴，可我一行代码都写不了。')],
      { choice: [
        { tag: 'empathy', label: Z('你上次好好写代码是什么时候？'), reply: [
          ['them', Z('……不记得了。')],
          ['them', Z('好像是事故前一周的周五。那天没有会，也没人找我。')],
        ] },
        { tag: 'solve', label: Z('那周一也能来了，你申请的日子我都排上。'), reply: [
          ['them', Z('嗯。周一周二周三都行。')],
          ['them', Z('（他揉了揉眼睛）……只要别让我五天都在被人问就好。')],
        ] },
        { tag: 'wild', label: Z('做一个佐藤的纸板立牌放在办公室，让大家去问它。'), reply: [
          ['them', Z('田中大概真的会去问它。')],
          ['them', Z('……其实我只需要一天，安安静静地写代码。周五最好，周五没有会。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: Z('当初是你第一个说「先按要求来」的吧。'), reply: [
          ['them', Z('是我。所以我不想第一个说不行。')],
        ] },
        { tag: 'solve', label: Z('再坚持一下，评分快回来了。'), reply: [
          ['them', Z('……我知道。')],
          ['them', Z('我只是想要一天，不用回答任何问题。')],
        ] },
        { tag: 'wild', label: Z('我们发明一个「佐藤免打扰日」，写进公司日历。'), reply: [
          ['them', Z('（笑）黑田会问那天的出勤率是多少。')],
          ['them', Z('……不过，要是周五能在家，我真的能喘口气。')],
        ] },
      ] },
      ['them', Z('这些话我还没跟任何人说过。')],
      { ask: {
        options: [
          { text: Z('周五在家，那天谁都别找他'), ok: true },
          { text: Z('周一还是要在家陪父亲') },
          { text: Z('一周最多来两天') },
          { text: Z('一定要按申请的日子来') },
        ],
        right: [['me', Z('周五你在家，那天谁都不许找你，包括我。')], ['them', Z('包括你？')], ['me', Z('包括我。')], ['them', Z('……谢谢。这是我这个月第一次觉得能喘口气。')]],
        wrong: [['them', Z('……嗯，我会撑住的。')], ['them', Z('（他笑了一下，但没有笑出声）')]],
      } },
    ],
  },
};

export const FINALE = [
  ['kuroda', T('上个月的出勤率是 60%，达到了目标。', 'Attendance last month was 60%. Target met.', '先月の出社率は60%。目標達成です。')],
  ['kuroda', T('不过说实话，我在作战室里看到的东西，比这个数字更有意义。', 'But to be honest, what I saw in the war room meant more to me than that number.', 'ただ正直に言うと、作戦室で見たもののほうが、この数字より意味がありました。')],
  ['kuroda', T('从下个月起，出勤天数由各团队自己决定。', 'Starting next month, each team decides its own office days.', '来月から、出社日数は各チームで決めてください。')],
  ['mori', T('既然今天大家都在，开发二组，来拍张合影吧！', "Since everyone's here today, Dev Team 2, let's take a group photo!", 'せっかく全員そろったし、開発2課、集合写真を撮ろう！')],
];

const M = (who, i = 0) => ['mood', who, i];
const ALL_SECOND = ['kobayashi', 'sato', 'tanaka', 'wang', 'abe', 'suzuki'].map(p => M(p, 1));
export const MOOD_CHATS = {
  1: { name: Z('周五 CFO 来了'), lines: [
    ['abe', Z('CFO 真的来了，在工位区站了五分钟')],
    ['tanaka', Z('她还问我在写什么……我说在写测试')],
    ['sato', Z('写测试是好事')],
    M('tanaka'),
    ['wang', Z('她有没有看到我的键盘')],
    ['abe', Z('看到了，她皱了一下眉')],
    M('abe'), M('wang'),
    ['suzuki', Z('网线终于布好了吗？上次来连 Wi-Fi 都断')],
    M('suzuki'), M('kobayashi'),
    ['sato', Z('听说下周开始要抽查了')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  2: { name: Z('抽查周'), lines: [
    ['wang', Z('CFO 这周抽查了三次。每次都站在门口数人头')],
    ['abe', Z('数到我的时候还点了点头，莫名紧张')],
    M('abe'),
    ['tanaka', Z('销售部那边空了好多桌子……')],
    ['sato', Z('山本さん那排已经被总务部贴上封条了')],
    M('tanaka'), M('sato'),
    ['kobayashi', Z('听说下个月咖啡也要停了？')],
    ['suzuki', Z('那我只能从长野带茶包来了')],
    M('suzuki'), M('kobayashi'), M('wang'),
    ...ALL_SECOND,
  ] },
  3: { name: Z('没有咖啡的一周'), lines: [
    ['abe', Z('周四 CFO 带了三个董事来参观，在我工位后面站了好久')],
    ['wang', Z('他们问我键盘是不是公司配的')],
    ['abe', Z('你怎么说')],
    ['wang', Z('我说是我自己的，青轴，很提神')],
    M('abe'), M('wang'),
    ['tanaka', Z('我的挂耳包已经被拿光了……')],
    ['sato', Z('谁拿的自觉一点')],
    M('tanaka'), M('sato'),
    ['suzuki', Z('这个月的交通费报销单退回来了。超了上限')],
    M('suzuki'),
    ['kobayashi', Z('总务部说下个月连打印纸都要申请')],
    M('kobayashi'),
    ...ALL_SECOND,
  ] },
  4: { name: Z('出勤日报'), lines: [
    ['kobayashi', Z('出勤率现在每天都贴在电梯口了')],
    ['abe', Z('开发二组那一栏用的是红色字体')],
    M('kobayashi'), M('abe'),
    ['wang', Z('周三要发新版本，同步模块大改')],
    ['sato', Z('迁移脚本多测一遍吧')],
    ['wang', Z('测过了。……大概')],
    M('wang'), M('sato'),
    ['tanaka', Z('佐藤さん，周三我能在旁边看你们发版吗')],
    M('tanaka'),
    ['suzuki', Z('发版那天我盯监控。有事叫我')],
    M('suzuki'),
    ...ALL_SECOND,
  ] },
  5: { name: Z('作战室第一周'), lines: [
    ['suzuki', Z('作战室的白板写满了。昨晚修了 14 个 bug')],
    ['wang', Z('还剩 31 个')],
    M('suzuki'), M('wang'),
    ['tanaka', Z('佐藤さん今天被问了多少个问题啊')],
    ['abe', Z('我数了，47 个。其中 12 个是你问的')],
    ['tanaka', Z('……对不起')],
    M('tanaka'), M('abe'),
    ['kobayashi', Z('客户那边暂时稳住了。下周还要再去一次')],
    M('kobayashi'),
    ['sato', Z('没事。大家有问题随时问')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  6: { name: Z('复盘会'), lines: [
    ['abe', Z('佐藤さん昨天又是 11 点才下线')],
    ['wang', Z('前天是 12 点')],
    ['kobayashi', Z('他周末也在线。我看到他凌晨两点还在改复盘文档')],
    M('abe'), M('wang'), M('kobayashi'),
    ['tanaka', Z('我想帮忙，可是我连复盘文档都看不太懂……')],
    M('tanaka'),
    ['suzuki', Z('评分 2.6 了。在往上走')],
    M('suzuki'),
    ['sato', Z('……我没事。')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  7: { name: Z('评分 3.4'), lines: [
    ['suzuki', Z('评分 3.4。这周差评少了一半')],
    ['abe', Z('新的错误提示上线了。用户说「终于看得懂了」')],
    M('suzuki'), M('abe'),
    ['tanaka', Z('我第一次一个人修好了一个 bug！')],
    ['wang', Z('合进去之前我看过了。写得不错')],
    M('tanaka'), M('wang'),
    ['kobayashi', Z('听说森さん这周在跟投资方开会')],
    M('kobayashi'),
    ['sato', Z('……周五我会准时下线')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  8: { name: Z('最后一周作战室'), lines: [
    ['wang', Z('最后一个崩溃修掉了')],
    ['suzuki', Z('监控全绿。我拍下来了')],
    M('wang'), M('suzuki'),
    ['abe', Z('作战室的白板谁来擦')],
    ['tanaka', Z('我来！我想留一张照片再擦')],
    M('abe'), M('tanaka'),
    ['kobayashi', Z('评分……我不敢看')],
    ['sato', Z('我也是')],
    M('kobayashi'), M('sato'),
    ...ALL_SECOND,
  ] },
  9: { name: Z('All Hands 当天'), lines: [
    ['tanaka', Z('我是不是来太早了，会场只有我一个人')],
    ['sato', Z('我也到了。在门口')],
    M('tanaka'), M('sato'),
    ['suzuki', Z('昨晚住的酒店离公司五分钟。这是我第一次走路上班')],
    ['kobayashi', Z('孩子们说要看合影')],
    M('suzuki'), M('kobayashi'),
    ['wang', Z('我带了静音键盘过来。以防万一')],
    ['abe', Z('以防什么万一')],
    M('wang'), M('abe'),
    ...ALL_SECOND,
  ] },
};

export const MOOD_LINES = {
  kobayashi: { happy: [Z('这周按时接到孩子了🙏'), Z('下午还陪他们去游了泳')], meh: [Z('周三被排进来了……婆婆帮忙接的孩子'), Z('下次不一定找得到人帮忙')], angry: [Z('这周排的日子我都走不开'), Z('我再想想办法吧……')] },
  sato: { happy: [Z('我这周挺顺的'), Z('陪我爸去复健也赶上了')], meh: [Z('周一早上从医院直接赶过来的'), Z('还行，就是有点累')], angry: [Z('……这周有点累'), Z('周一那天我爸是一个人去的医院')] },
  tanaka: { happy: [Z('佐藤さん在的那天，我问了好多问题！'), Z('其他日子自己查文档，也慢慢习惯了')], meh: [Z('今天一个人在办公室，不知道该问谁……'), Z('佐藤さん那天怎么没来呀')], angry: [Z('这周我好像一直是一个人……'), Z('要么就是一直跟着佐藤さん，他好像也有点烦我了')] },
  wang: { happy: [Z('这周作息没崩，难得'), Z('隔一天来一次，刚好')], meh: [Z('周初就来公司……我现在看代码是重影的'), Z('下次周一周二饶了我吧')], angry: [Z('我已经不知道今天星期几了'), Z('这周的班是谁排的')] },
  abe: { happy: [Z('这周耳根清净，图画得特别顺'), Z('设计稿提前一天交了')], meh: [Z('旁边一直有键盘声……算了'), Z('戴了一整天耳机，耳朵疼')], angry: [Z('青轴键盘陪了我一整天'), Z('我申请的日子也没给我')] },
  suzuki: { happy: [Z('这周一趟新干线办完两天的事，划算'), Z('晚上在东京吃了拉面')], meh: [Z('这周跑了两趟长野和东京，有点累'), Z('交通费又要超了')], angry: [Z('新干线来回两趟，这个月的交通费已经超了……'), Z('申请的日子也没排上，白跑一趟')] },
  'tanaka@5': { happy: [Z('这周两天都有佐藤さん在，问题全清空了！'), Z('第三天我自己修了一个 bug')], meh: [Z('这周跟佐藤さん一起的日子不太对……'), Z('要么一个人卡着，要么一直跟着他')], angry: [Z('这周我好像一直是一个人……'), Z('申请的日子也没排上')] },
  'wang@5': { happy: [Z('三天都没连着，作息还撑得住'), Z('难得')], meh: [Z('这周的排班，我的作息崩了'), Z('周一或者连着三天，哪个都要命')], angry: [Z('我已经不知道今天星期几了'), Z('这周的班是谁排的')] },
  'abe@5': { happy: [Z('和老王当面对了一天接口，剩下的日子耳根清净'), Z('错误提示的文案改完了')], meh: [Z('接口还是没当面对好……'), Z('要么见不到老王，要么被键盘声包围好几天')], angry: [Z('这周不是见不到老王，就是天天听他的键盘'), Z('申请的日子也没给我')] },
  'sato@7': { happy: [Z('周五在家写了一整天代码'), Z('没有人找我。谢谢')], meh: [Z('周五还是在办公室……被问了一天问题'), Z('下周再说吧')], angry: [Z('……这周有点累'), Z('周五也没能歇一下')] },
  'wang@9': { happy: [Z('这周连着来也撑住了，为了合影'), Z('周一照样补了觉')], meh: [Z('周一还是来了……'), Z('合影里我大概是闭着眼的')], angry: [Z('我已经不知道今天星期几了'), Z('这周的班是谁排的')] },
};

const failed = n => S => S.fails >= n;
const F = [['email:remind', failed(1)], ['email:warn', failed(2)]];
export const BEATS = [
  ['email:welcome'],
  ['chat:happy', 'email:cfo', F[0], 'chat:complain', 'talk:kobayashi'],
  ['chat:mood1', ...F, 'email:layoff', 'chat:layoff', 'talk:wang'],
  ['chat:mood2', ...F, 'email:perks', 'chat:perks', 'talk:suzuki'],
  ['chat:mood3', ...F, 'talk:tanaka'],
  ['chat:mood4', ...F, 'chat:reviews', 'email:warroom', 'talk:abe'],
  ['chat:mood5', ...F],
  ['chat:mood6', ...F, 'talk:sato'],
  ['chat:mood7', ...F, 'email:deadline'],
  ['chat:mood8', ...F, 'chat:thaw', 'email:allhands', 'chat:ready'],
  ['chat:mood9', 'finale'],
];
