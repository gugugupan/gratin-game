import { T } from './levels.js';

export const COMPANY = T('一个公司', 'A Company', 'ある会社');

export const EMAILS = {
  remind: {
    from: 'kuroda', date: T('周五 18:30', 'Fri 18:30', '金曜 18:30'),
    to: T('开发二组经理', 'Dev Team 2 manager', '開発2課マネージャー'),
    subject: T('关于开发二组的出勤率', "About Dev Team 2's attendance", '開発2課の出社率について'),
    body: [T('你好。', 'Hello.', 'お疲れさまです。'), T('上周开发二组的出勤率没有达到目标。请多加留意。', "Dev Team 2's attendance missed the target last week. Please keep an eye on it.", '先週、開発2課の出社率が目標に届きませんでした。ご留意ください。'), T('黑田', 'Kuroda', '黒田')],
  },
  warn: {
    from: 'kuroda', date: T('周五 18:30', 'Fri 18:30', '金曜 18:30'),
    to: T('开发二组经理', 'Dev Team 2 manager', '開発2課マネージャー'),
    subject: T('【警告】开发二组出勤率再次未达标', '[Warning] Dev Team 2 missed the attendance target again', '【警告】開発2課の出社率が再び未達'),
    body: [T('开发二组的出勤率第二次没有达到目标。', "Dev Team 2's attendance has missed the target for the second time.", '開発2課の出社率の未達は、これで2回目です。'), T('如果再有一次，我将不得不重新评估你的岗位。', 'If it happens again, I will have to reconsider your position.', '次も未達の場合、あなたのポジションを見直さざるを得ません。'), T('黑田', 'Kuroda', '黒田')],
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
    ps: T('PS：从明天起，你可以每天在家办公了。', 'PS: From tomorrow, you can work from home every day.', '追伸：明日からは毎日在宅勤務できますよ。'),
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
    from: 'mori', date: T('12月4日 周五 22:40', 'Fri, Dec 4 · 22:40', '12月4日(金) 22:40'),
    to: T('开发部门全体', 'All Engineering', '開発部門全員'),
    subject: T('下周五', 'Next Friday', '来週の金曜'),
    body: [
      T('评分现在是 3.4。投资方说，如果下周五之前回不到 4.0，下一轮就不投了。', 'The rating is 3.4 right now. Our investors say that if it is not back to 4.0 by next Friday, they will not join the next round.', '評価は現在3.4です。来週金曜までに4.0に戻らなければ、次のラウンドには出資しないと投資家から言われました。'),
      T('我知道大家已经连着三周每周来三天，很多人很累。', 'I know you have been coming in three days a week for three weeks straight, and many of you are exhausted.', '3週続けて週3日出社してもらっていて、多くの人が疲れているのは分かっています。'),
      T('我能做的只有相信你们。也请各位经理，照顾好自己的人。', 'All I can do is trust you. And managers, please look after your people.', '私にできるのは皆さんを信じることだけです。マネージャーの皆さん、どうか自分のチームを守ってください。'),
      T('森', 'Mori', '森'),
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
  happy: { name: T('新办公室初体验', 'First look at the new office', '新オフィス初体験'), channel: '#dev-2', msgs: [
    ['abe', T('新办公室的光线好适合拍照', 'The light in the new office is great for photos', '新オフィス、光がいい感じ。写真撮りたくなる')],
    ['wang', T('咖啡机确实不错。就是早上九点的电车人太多了', "The coffee machine is nice, I'll give them that. The 9 a.m. train is packed though", 'コーヒーマシンはまあ悪くない。朝9時の電車がしんどいけど')],
    ['tanaka', T('佐藤さん带我逛了一圈，居然有午睡舱！', "Sato-san gave me a tour. There's a nap pod!", '佐藤さんに案内してもらいました。仮眠ポッドまであるんですね！')],
    ['sato', T('午睡舱是给老王准备的', 'The nap pod is for Wang', '仮眠ポッドは王さん用だよ')],
    ['wang', T('……我不否认', "…I won't deny it", '……否定はできない')],
    ['kobayashi', T('一周来一次刚刚好，不用麻烦婆婆接孩子', "Once a week is just right. I don't have to ask my mother-in-law to pick up the kids", '週1ならちょうどいいね。義母にお迎え頼まなくて済むし')],
    ['suzuki', T('监控大屏装好了。这次坐的是早上六点的新干线，困死', 'The monitoring wall is up. I took the 6 a.m. Shinkansen for this. So sleepy', '監視モニター、設置完了。今回は朝6時の新幹線。眠い')],
    ['abe', T('铃木さん辛苦了。下次来住一晚吧，附近有家不错的拉面', "Thanks, Suzuki-san. Stay the night next time, there's a good ramen place nearby", '鈴木さんお疲れさま。次は泊まっていきなよ、近くにおいしいラーメン屋あるから')],
    ['suzuki', T('住一晚的话……一趟待两天倒是划算', 'Stay the night… Two days for one trip would actually be worth it', '泊まりか……1往復で2日いられるなら、ありだな')],
    ['tanaka', T('下周还能见到大家吗？', 'Will I see everyone again next week?', '来週もみんなに会えますか？')],
    ['kobayashi', T('看 HQ 怎么说吧', 'Depends on what HQ says', '本社がどう言うかだね')],
  ] },
  complain: { name: T('出勤新政策', 'The new attendance policy', '新しい出社ポリシー'), channel: '#dev-2', msgs: [
    ['wang', T('……2 天？', '…2 days?', '……週2日？')],
    ['kobayashi', T('我把邮件看了三遍，还是 2 天', 'I read the email three times. Still 2 days', 'メール3回読み直したけど、やっぱり週2だった')],
    ['abe', T('「出勤率纳入经理考核」。懂了，是新经理的 KPI', '"Attendance becomes part of manager evaluations." Got it, it\'s the new manager\'s KPI', '「出社率をマネージャー評価に反映」。ああ、新しいマネージャーのKPIってことか')],
    ['wang', T('我周末又要发版。周一周二就别指望我了', "I've got another release this weekend. Don't count on me Monday or Tuesday", '週末またリリースだから、月曜と火曜は無理だと思って')],
    ['suzuki', T('大家知道我住在长野吧。新干线来回一趟 1.6 万，来一次最好多待两天', "You all know I live in Nagano, right? A Shinkansen round trip is ¥16,000. If I come in, I'd rather stay two days", '知ってると思うけど、僕、長野なんだよね。新幹線往復1万6千円。来るなら2日はいたい')],
    ['abe', T('办公室好吵。尤其是某人的青轴键盘……他来的日子我能不来吗', "The office is so loud. Especially a certain someone's clicky keyboard… Can I skip the days he's in?", 'オフィス、うるさすぎ。特に誰かさんの青軸……あの人が来る日、私休んでいい？')],
    ['wang', T('青轴怎么了，青轴是信仰', "What's wrong with clicky switches? Clicky is a religion", '青軸の何が悪いの。青軸は宗教だから')],
    ['tanaka', T('我都可以！……就是一个人在办公室的时候，不知道该问谁', "Any day works for me! …It's just, when I'm alone in the office, I don't know who to ask", '僕はいつでも大丈夫です！……ただ、オフィスで一人だと誰に聞けばいいか分からなくて')],
    ['sato', T('我哪天都行，先按要求来吧。……周一早上我得先送我爸去医院就是了', "Any day is fine with me. Let's just follow the rules for now. …Though Monday mornings I have to take my dad to the hospital first", '僕はいつでもいいよ。まずは言われた通りにやってみよう。……月曜の朝だけは、父を病院に送ってからになるけど')],
    ['tanaka', T('佐藤さん在的话我就放心了。不过也不好意思每天都黏着您……', "I feel safe when Sato-san is there. But I can't stick to you every single day…", '佐藤さんがいてくれると安心です。でも毎日くっついているのも申し訳なくて……')],
    ['kobayashi', T('我也会配合的。……就是周三下午有点那个', "I'll go along with it too. …Wednesday afternoons are a bit, you know", '私もちゃんと協力するよ。……水曜の午後だけ、ちょっとあれだけど')],
    ['abe', T('那个是哪个？', 'Know what?', 'あれって？')],
    ['kobayashi', T('没什么，我会想办法的', "Nothing. I'll figure something out", 'ううん、なんでもない。なんとかするから')],
    ['wang', T('我反正不想去', "Either way, I don't want to go", '俺はとにかく行きたくない')],
    ['suzuki', T('+1', '+1', '+1')],
    ['abe', T('+1', '+1', '+1')],
  ] },
  layoff: { name: T('销售部的事', 'What happened in Sales', '営業部のこと'), channel: '#dev-2', msgs: [
    ['tanaka', T('销售部的山本さん今天把桌子清空了……', 'Yamamoto-san from Sales cleared out his desk today…', '営業部の山本さん、今日デスクを片付けてました……')],
    ['abe', T('我看到了，纸箱里还有他女儿画的画', 'I saw. There was a drawing by his daughter in the box', '見た。段ボールに娘さんの絵が入ってた')],
    ['wang', T('「其他部门暂无调整计划」。这句话我在三家公司都见过', '"There are currently no plans for other departments." I\'ve seen that line at three companies', '「その他の部門について現時点で計画はありません」。この文言、前の3社でも見たわ')],
    ['sato', T('别乱想，先把手上的事做好', "Don't overthink it. Focus on the work in front of you", 'あまり考えすぎないで。まずは目の前の仕事をやろう')],
    ['tanaka', T('有佐藤さん在的那天，我问问题都不紧张了。可是天天黏着他好像也不太好……', "On days Sato-san is in, I'm not nervous asking questions. But sticking to him every day doesn't seem right either…", '佐藤さんがいる日は、質問するのも緊張しないんです。でも毎日くっついているのもよくない気がして……')],
    ['abe', T('今天又是键盘交响乐的一天', 'Another day of the keyboard symphony', '今日も一日、キーボードの交響曲')],
    ['wang', T('我已经换成静音的那块了', 'I already switched to the quiet one', 'もう静音のに替えたって')],
    ['abe', T('静音的也是青轴改的吧', "The quiet one is a modded clicky, isn't it", 'その静音のって、青軸を改造したやつでしょ')],
    ['wang', T('……被你发现了。说真的，要是连着两天早起，我看代码会是重影的', '…You caught me. Honestly though, if I get up early two days in a row, I start seeing double in the code', '……バレたか。いや真面目な話、2日続けて早起きするとコードが二重に見えるんだって')],
    ['suzuki', T('我在新干线上把告警都处理完了。要是一趟能待两天就好了', 'I handled all the alerts on the Shinkansen. If only one trip could cover two days', 'アラートは新幹線の中で全部さばいた。1往復で2日いられたらいいのに')],
    ['kobayashi', T('大家注意身体。……我先下线了，三点要到幼儿园', "Take care of yourselves, everyone. …I'm logging off, I need to be at the daycare by three", 'みんな無理しないでね。……ごめん、先に抜けるね。3時に保育園なの')],
  ] },
  perks: { name: T('咖啡没了', 'No more coffee', 'コーヒー終了'), channel: '#dev-2', msgs: [
    ['abe', T('咖啡机还在，咖啡没了', "The coffee machine stays. The coffee doesn't", 'コーヒーマシンはあるのに、コーヒーはない')],
    ['wang', T('你品，你细品', 'Let that sink in', '……深いね')],
    ['kobayashi', T('年末聚会也取消了……孩子们还说想见见大家', 'The year-end party got cancelled too… My kids said they wanted to meet everyone', '忘年会もなくなっちゃったね……子どもたち、みんなに会えるの楽しみにしてたのに')],
    ['tanaka', T('我带了挂耳包，大家要的话在我抽屉里', "I brought drip coffee bags. They're in my drawer if anyone wants some", 'ドリップバッグ持ってきました。欲しい人は僕の引き出しにあります')],
    ['sato', T('田中，谢谢。不过你自己也留几包', 'Thanks, Tanaka. Keep a few for yourself though', '田中、ありがとう。でも自分の分もちゃんと取っておきなよ')],
    ['suzuki', T('交通费上限 3 万日元。长野到东京新干线往返 1.6 万。', 'Commuting cap: ¥30,000. A Nagano–Tokyo Shinkansen round trip: ¥16,000.', '交通費の上限は3万円。長野〜東京の新幹線往復は1万6千円。')],
    ['kobayashi', T('……那还要求每周来两次？', '…And they still want us in twice a week?', '……それで週2回来いって？')],
    ['suzuki', T('我算了一下，一个月要倒贴将近 10 万日元。', "I did the math. I'd be paying almost ¥100,000 a month out of pocket.", '計算したら、月に10万円近く自腹になる。')],
    ['suzuki', T('来一次待两天的话，就只要一趟车钱。可是住一晚的酒店又得自己掏', "If I stay two days per trip, it's only one fare. But then I pay for the hotel myself", '1回で2日いれば電車代は1往復分で済む。でもホテル代は自腹')],
    ['abe', T('分区熄灯也开始了。我那排下午四点就黑了', 'Zoned lights-out has started too. My row goes dark at 4 p.m.', 'エリア別消灯も始まったよ。うちの列、4時には真っ暗')],
    ['wang', T('正好，我可以在黑暗里敲键盘', 'Perfect. I can type in the dark', 'ちょうどいいじゃん。暗闇でキーボード打てる')],
    ['abe', T('你敢', "Don't you dare", 'やったら許さないから')],
  ] },
  reviews: { name: T('评分告急', 'Rating emergency', '評価が危ない'), channel: '#general', msgs: [
    ['nakamura', T('大家看一下应用商店，评分从 4.6 掉到 2.1 了', 'Everyone, check the app store. Our rating dropped from 4.6 to 2.1', '皆さん、ストアを見てください。評価が4.6から2.1に下がっています')],
    ['nakamura', T('「同步把我的笔记全删了」「更新后打不开」，一千多条', '"Sync deleted all my notes," "Won\'t open after the update"… over a thousand of them', '「同期でノートが全部消えた」「アップデート後に開かない」、1000件以上です')],
    ['wang', T('是周三那次发版。迁移脚本在旧版本上跑了两遍。我在查。', "It's Wednesday's release. The migration script ran twice on old versions. I'm on it.", '水曜のリリースのせい。マイグレーションが旧バージョンで2回走ってた。今調べてる。')],
    ['sato', T('我来组织复盘。大家先修 bug。', "I'll run the postmortem. Everyone, fix bugs first.", '振り返りは僕がまとめる。みんなはまずバグを直して。')],
    ['abe', T('错误提示也得重写，现在用户看到的是一串英文代码', 'The error messages need rewriting too. Right now users just see a string of error codes', 'エラーメッセージも書き直さなきゃ。今ユーザーに出てるの、英語のエラーコードだけだよ')],
    ['abe', T('……文案和接口得跟老王当面对。远程对了三次，三次都对错了', '…The copy and the API have to be worked out with Wang in person. We tried remotely three times and got it wrong three times', '……文言とAPIは王さんと対面で詰めないと無理。リモートで3回やって、3回ともずれたし')],
    ['kuroda', T('各位，稍后会发邮件。', 'Everyone, an email will follow shortly.', '皆さん、後ほどメールします。')],
    ['tanaka', T('……我有不好的预感', '…I have a bad feeling about this', '……嫌な予感がします')],
    ['suzuki', T('监控我盯着。今晚不睡了', "I'm watching the monitors. Not sleeping tonight", '監視は僕が見とく。今夜は寝ない')],
    ['kobayashi', T('客户那边我去道歉。你们专心修', "I'll go apologize to the clients. You focus on fixing", 'お客さんには私が謝りに行ってくる。みんなは修正に集中して')],
  ] },
  thaw: { name: T('评分回来了', 'The rating is back', '評価が戻った'), channel: '#general', msgs: [
    ['nakamura', T('评分回到 4.3 了！🎉', 'The rating is back to 4.3! 🎉', '評価が4.3に戻りました！🎉')],
    ['nakamura', T('有用户说新的错误提示「意外地很温柔」', 'One user said the new error messages are "surprisingly gentle"', '新しいエラーメッセージが「意外とやさしい」というレビューがありました')],
    ['abe', T('那是我和老王在办公室一起改的', 'Wang and I rewrote those together in the office', 'それ、王さんとオフィスで一緒に直したやつ')],
    ['wang', T('用的是静音键盘', 'On the quiet keyboard', '静音キーボードで、ね')],
    ['abe', T('……这次是真的静音的', '…This time it actually was quiet', '……今回は本当に静かだったよ')],
    ['sato', T('复盘文档我整理完了。田中写了其中一节', "I've finished the postmortem doc. Tanaka wrote one of the sections", '振り返りドキュメント、まとめ終わったよ。1節は田中が書いてくれた')],
    ['tanaka', T('是、是最短的那一节……', "I-it's the shortest one…", 'い、一番短い節ですけど……')],
    ['suzuki', T('这周一次告警都没有。我想去睡一觉', 'Not a single alert this week. I want to go sleep', '今週はアラートゼロ。寝たい')],
    ['kobayashi', T('辛苦了，各位。周三我请大家吃点心，寄到你们家里', "Great work, everyone. Snacks are on me Wednesday, I'll have them sent to your homes", 'みんな本当にお疲れさま。水曜にお菓子送るね、家に届くようにしておくから')],
  ] },
  ready: { name: T('All Hands 前夜', 'The night before All Hands', 'All Hands前夜'), channel: '#dev-2', msgs: [
    ['kobayashi', T('周四我去，孩子拜托给婆婆了', "I'll be there Thursday. My mother-in-law has the kids", '木曜は行くよ。子どもは義母にお願いした')],
    ['suzuki', T('周三、周四的酒店订好了。这次算出差', 'Hotel booked for Wednesday and Thursday. This time it counts as a business trip', '水曜と木曜のホテル取った。今回は出張扱い')],
    ['tanaka', T('我可以坐在佐藤さん旁边吗', 'Can I sit next to Sato-san?', '佐藤さんの隣に座ってもいいですか')],
    ['sato', T('可以。这次不复盘，只吃饭', 'Sure. No postmortem this time, just food', 'いいよ。今日は振り返りなし、食べるだけ')],
    ['wang', T('这周我连着来也行。为了合影。', "I'll do back-to-back days this week. For the photo.", '今週は連続で来てもいいよ。集合写真のためなら。')],
    ['abe', T('那你周一呢', 'And Monday?', 'で、月曜は？')],
    ['wang', T('周一照样补觉。我又不是变了一个人', "Monday I still sleep in. I'm not a different person", '月曜はいつも通り寝る。別に人が変わったわけじゃないし')],
    ['abe', T('那我带降噪耳机去合影', "Then I'm wearing noise-cancelling headphones in the photo", 'じゃあ私、ノイキャンつけたまま写るね')],
  ] },
};

export const TALKS = {
  kobayashi: {
    lines: [
      ['them', T('你找我？是出勤的事吧。', "You wanted to see me? It's about attendance, right?", 'お呼びですか？出社の件ですよね。')],
      ['me', T('嗯。新政策下来了，我想先听听你的想法。', 'Yeah. The new policy is out, and I wanted to hear what you think first.', 'うん。新しいポリシーが出たから、まずあなたの考えを聞きたくて。')],
      ['them', T('……我会配合的。公司的决定嘛。', "…I'll go along with it. It's the company's decision.", '……協力しますよ。会社の決定ですから。')],
      { choice: [
        { tag: 'empathy', label: T('「配合」听起来有点勉强。有什么不方便的，可以直接跟我说。', '"Go along with it" sounds a little forced. If something doesn\'t work for you, just tell me.', '「協力します」はちょっと無理してるように聞こえる。都合が悪いことがあれば、そのまま言って。'), reply: [
          ['them', T('……你真想听？', '…You really want to hear it?', '……本当に聞きたいですか？')],
          ['them', T('我家两个孩子，幼儿园下午四点就关门。从公司赶回去要一个小时。', 'I have two kids, and the daycare closes at 4 p.m. It takes an hour to get back from the office.', 'うち、子どもが2人いて、保育園が夕方4時に閉まるんです。会社からだと帰るのに1時間かかって。')],
        ] },
        { tag: 'solve', label: T('那你申请想哪几天来，我尽量按申请排。', "Then put in the days you want, and I'll schedule you as close to that as I can.", 'じゃあ来たい日を申請して。できるだけ申請通りに組むから。'), reply: [
          ['them', T('好，我填了周一和周二。', 'Okay. I put down Monday and Tuesday.', 'はい、月曜と火曜にしました。')],
          ['them', T('（她停了一下）……没事，就这两天吧。', "(She pauses.) …It's fine. Those two days.", '（少し間があって）……大丈夫です、その2日で。')],
        ] },
        { tag: 'wild', label: T('要不我们把办公室搬到你家楼下？', 'What if we moved the office downstairs from your place?', 'いっそオフィスをあなたの家の下に移す？'), reply: [
          ['them', T('（笑）那房租 CFO 会先把你开了。', '(laughs) The CFO would fire you over the rent first.', '（笑）その家賃じゃ、CFOが先にマネージャーをクビにしますよ。')],
          ['them', T('不过……要是离家近一点就好了。孩子的事总是突然冒出来。', 'Still… it would be nice if it were closer to home. Things with the kids always come up out of nowhere.', 'でも……家から近かったらいいのに。子どものことって、いつも急に起きるので。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('孩子平时是谁去接？', 'Who usually picks up the kids?', 'お迎えは普段誰が行ってるの？'), reply: [
          ['them', T('一般是我。周三最麻烦，幼儿园三点就放学，还要赶游泳课。', "Usually me. Wednesday is the worst. Daycare lets out at three, and then there's swim class.", 'だいたい私です。水曜が一番大変で、保育園が3時に終わって、そのあとプール教室なんです。')],
        ] },
        { tag: 'solve', label: T('那你那几天尽量早点走就好。', 'Then just try to leave early on those days.', 'じゃあその日はなるべく早く帰ればいいよ。'), reply: [
          ['them', T('早点走……也不是每天都走得开。算了，我再想想办法。', "Leave early… I can't always get away. Never mind, I'll figure something out.", '早く帰る、ですか……毎日抜けられるわけじゃないんですよね。いえ、なんとかします。')],
        ] },
        { tag: 'wild', label: T('我可以给你做一个接孩子的机器人。', 'I could build you a kid-pickup robot.', 'お迎えロボットを作ってあげようか。'), reply: [
          ['them', T('老王应该会很感兴趣。……其实一周里最难的就是周三，三点就得到幼儿园。', 'Wang would love that. …Honestly, the hardest day of the week is Wednesday. I have to be at daycare by three.', '王さんが食いつきそう。……実は一週間で一番きついのは水曜なんです。3時には保育園に着いてないと。')],
        ] },
      ] },
      ['them', T('不管怎样，申请我就先那么填了。你看着排吧。', "Anyway, I've filled in my request like that. Schedule me however you see fit.", 'とにかく、申請はそのまま出しておきます。あとはお任せします。')],
      { ask: {
        options: [
          { text: T('周三必须在家', 'Has to be remote on Wednesday', '水曜は在宅でないと困る'), ok: true },
          { text: T('每天下午三点前就得下班', 'Has to leave before 3 p.m. every day', '毎日午後3時前に退社しないといけない') },
          { text: T('周四必须在家', 'Has to be remote on Thursday', '木曜は在宅でないと困る') },
          { text: T('一定要按申请的周一、周二来', 'Has to come in exactly on her requested Monday and Tuesday', '申請通り月曜・火曜に出社したい') },
        ],
        right: [['me', T('周三你就在家吧。申请上写的周三，我不会排。', "Stay home on Wednesdays. Even if your request says Wednesday, I won't schedule you.", '水曜は在宅にしよう。申請に水曜があっても、入れないから。')], ['them', T('……你听出来了啊。谢谢。其实我一直怕被说不配合，所以申请里一个字都没提。', '…You picked up on it. Thank you. I was afraid of looking uncooperative, so I never wrote a word about it in my request.', '……気づいてくれたんですね。ありがとうございます。協力的じゃないと思われるのが怖くて、申請には一言も書けなかったんです。')]],
        wrong: [['them', T('……嗯，好。', '…Okay, sure.', '……はい、分かりました。')], ['them', T('（她没再多说什么）', "(She doesn't say anything more.)", '（彼女はそれ以上何も言わなかった）')]],
      } },
    ],
  },
  wang: {
    lines: [
      ['them', T('你是来劝我去公司的吧。', "You're here to talk me into coming in, aren't you.", 'どうせ出社しろって話でしょ。')],
      ['me', T('我是来听你说的。', "I'm here to listen.", '話を聞きに来たんだよ。')],
      ['them', T('没什么好说的，排就排呗。', 'Nothing to say. Schedule me if you have to.', '別に話すことないよ。組みたいように組めば。')],
      { choice: [
        { tag: 'empathy', label: T('上周你看起来挺累的。', 'You looked pretty tired last week.', '先週、だいぶ疲れてるように見えたけど。'), reply: [
          ['them', T('周末又发版，周日凌晨四点才睡。周一早上？别想了。', 'Another weekend release. I went to bed at 4 a.m. Sunday. Monday morning? Forget it.', '週末またリリースで、寝たの日曜の朝4時。月曜の朝？無理無理。')],
        ] },
        { tag: 'solve', label: T('那你申请的那两天，我给你排上？', 'So should I just give you the two days you asked for?', 'じゃあ申請の2日をそのまま入れておく？'), reply: [
          ['them', T('随便。……反正排哪天我都是僵尸。', "Whatever. …I'm a zombie whichever day you pick.", '好きにしなよ。……どの日にしたってゾンビだから。')],
        ] },
        { tag: 'wild', label: T('在办公室装个吊床？白天你睡，晚上写代码。', 'Put a hammock in the office? You sleep during the day and code at night.', 'オフィスにハンモックを置く？昼は寝て、夜にコードを書く。'), reply: [
          ['them', T('总务部会先把你裁了。', 'General Affairs would lay you off first.', 'その前に総務部にリストラされるって。')],
          ['them', T('……不过你说到点子上了：问题在时间，不在地点。周一早上尤其不行。', "…But you're onto something: the problem is the time, not the place. Monday mornings especially.", '……でも、いいとこ突いてる。問題は場所じゃなくて時間なんだよ。特に月曜の朝はダメ。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('那连着两天来，会怎么样？', 'What happens if you come in two days in a row?', 'じゃあ2日連続で来たらどうなるの？'), reply: [
          ['them', T('来一天还行，第二天作息就全乱了。中间隔一天，我就能缓过来。', 'One day is fine. On the second day my whole schedule falls apart. With a day in between, I can recover.', '1日ならいける。2日目で生活リズムが全部崩れる。間に1日挟めば戻せるんだけど。')],
        ] },
        { tag: 'solve', label: T('那就多喝点咖啡吧。', 'Then drink more coffee.', 'じゃあコーヒーを多めに飲めば。'), reply: [
          ['them', T('咖啡？听说总务部要停了。', 'Coffee? I heard General Affairs is cutting it.', 'コーヒー？それ、総務部が止めるって噂だよ。')],
        ] },
        { tag: 'wild', label: T('我们把周一改名叫周二怎么样？', 'What if we renamed Monday to Tuesday?', '月曜を火曜って呼ぶことにしない？'), reply: [
          ['them', T('（笑）那我的周日就更短了。……其实只要别让我连着两天来，中间隔一天就行。', "(laughs) Then my Sunday gets even shorter. …Really, just don't make me come in two days in a row. A day in between is all I need.", '（笑）それ、日曜がもっと短くなるだけじゃん。……まあ要は、2日連続じゃなければいいんだよ。間に1日あれば。')],
        ] },
      ] },
      ['them', T('这周机房要换硬盘，我总得去一天。其他的，你看着办。', "They're swapping disks in the machine room this week, so I have to go in one day anyway. The rest is up to you.", '今週はサーバールームでディスク交換があるから、どうせ1日は行くよ。あとは任せる。')],
      { ask: {
        options: [
          { text: T('周一在家，而且不连续两天出社', 'Remote on Monday, and never two office days in a row', '月曜は在宅、2日連続の出社はNG'), ok: true },
          { text: T('只想上夜班', 'Only wants night shifts', '夜勤しかしたくない') },
          { text: T('一周最多只来一天', 'Comes in at most once a week', '出社は週1日まで') },
          { text: T('一定要按申请的日子来', 'Has to come in exactly on the requested days', '申請通りの日に出社したい') },
        ],
        right: [['me', T('周一你在家，来的日子我也会隔开排。', "You stay home on Mondays, and I'll space out your office days.", '月曜は在宅、出社日も間を空けて組むよ。')], ['them', T('……行。那我尽量不在群里抱怨了。', "…Fine. Then I'll try not to complain in the group chat.", '……了解。じゃあグループで愚痴るのはなるべくやめとく。')]],
        wrong: [['them', T('……随你。', '…Suit yourself.', '……ご自由に。')]],
      } },
    ],
  },
  suzuki: {
    lines: [
      ['them', T('先说好，我不是不想见大家。', "Just so we're clear, it's not that I don't want to see everyone.", '先に言っておくと、みんなに会いたくないわけじゃないんです。')],
      ['them', T('疫情的时候公司说可以全远程，我才搬回长野照顾父母。现在交通费有了上限，新干线来回一趟就是 1.6 万。', "During the pandemic the company said full remote was fine, so I moved back to Nagano to look after my parents. Now there's a cap on commuting, and a Shinkansen round trip is ¥16,000.", 'コロナの時に会社がフルリモートでいいと言ったから、両親の世話のために長野に戻ったんです。今は交通費に上限があって、新幹線は往復で1万6千円なんです。')],
      ['me', T('嗯。你搬家是公司同意过的。', 'Right. The company approved your move.', 'うん。引っ越しは会社も認めたことだよね。')],
      { choice: [
        { tag: 'empathy', label: T('每周跑两趟东京，身体吃得消吗？', 'Can your body handle two trips to Tokyo a week?', '週2回東京に来るの、体は持つ？'), reply: [
          ['them', T('早上五点起，赶六点的新干线。晚上回去还要照顾我妈。', "Up at five to catch the six o'clock Shinkansen. Then back home at night to take care of my mom.", '朝5時に起きて、6時の新幹線です。夜帰ったら母の世話もあって。')],
          ['them', T('说实话，跑两趟是最累的。来一趟能多待一天就好了。', "Honestly, the two trips are what wear me out. If one trip could cover an extra day, that'd help.", '正直、2往復が一番きついです。1回で1日多くいられたら助かるんですけど。')],
        ] },
        { tag: 'solve', label: T('那你申请的那两天，我都给你排上。', "Then I'll give you both days you asked for.", 'じゃあ申請の2日は両方入れておくよ。'), reply: [
          ['them', T('……好啊。', '…Sure.', '……いいですよ。')],
          ['them', T('（他在手机上算着什么）嗯，没事。', "(He's calculating something on his phone.) Yeah, it's fine.", '（スマホで何か計算している）うん、大丈夫です。')],
        ] },
        { tag: 'wild', label: T('干脆在长野开个分公司？你当分公司社长。', "Why not open a Nagano branch? You'd be branch president.", 'いっそ長野に支社を作る？あなたが支社長で。'), reply: [
          ['them', T('（笑）社长兼保洁兼 SRE？', '(laughs) President, janitor, and SRE?', '（笑）支社長兼清掃係兼SREですか？')],
          ['them', T('……其实不用那么麻烦。一趟车能待两天，路费就省一半。', "…It doesn't need to be that complicated. If one trip covers two days, the fare is cut in half.", '……そこまでしなくても大丈夫です。1往復で2日いられれば、交通費は半分で済むので。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('那待两天的话，晚上住哪？', 'If you stay two days, where do you sleep?', '2日いるなら、夜はどこに泊まるの？'), reply: [
          ['them', T('自己找酒店，自己掏钱。……要是能算出差就好了。', 'I find a hotel and pay for it myself. …If only it counted as a business trip.', 'ホテルは自分で探して自腹です。……出張扱いにしてもらえたらいいんですけど。')],
        ] },
        { tag: 'solve', label: T('那你在新干线上尽量把活干完？', 'So try to get your work done on the Shinkansen?', 'じゃあ新幹線の中でなるべく仕事を片付けたら？'), reply: [
          ['them', T('告警我已经在新干线上处理了。问题不是干活，是一趟 1.6 万。', "I already handle alerts on the Shinkansen. The problem isn't the work, it's ¥16,000 a trip.", 'アラートはもう新幹線でさばいてます。問題は仕事じゃなくて、1往復1万6千円なんです。')],
        ] },
        { tag: 'wild', label: T('我去跟总务部说，新干线算团建。', "I'll tell General Affairs the Shinkansen counts as team building.", '総務部に、新幹線はチームビルディングだって言ってみる。'), reply: [
          ['them', T('总务部会说，咖啡都停了还团建？', 'General Affairs would say: we cut the coffee and you want team building?', '総務部に「コーヒーも止めたのにチームビルディング？」って言われますよ。')],
          ['them', T('（笑）我只要两天连着就行，中间住一晚。', '(laughs) I just need the two days back-to-back, with one night in between.', '（笑）2日連続で、間に一泊できればそれでいいんです。')],
        ] },
      ] },
      ['them', T('父母那边我会安排。你看着排吧。', "I'll work things out with my parents. Schedule me however you think best.", '両親のほうは何とかします。組み方はお任せします。')],
      { ask: {
        options: [
          { text: T('出社日要连在一起', 'Office days have to be back-to-back', '出社日は連続にしたい'), ok: true },
          { text: T('一周只能来一天', 'Can only come in one day a week', '週1日しか来られない') },
          { text: T('只能周五来', 'Can only come in on Fridays', '金曜しか来られない') },
          { text: T('一定要按申请的日子来', 'Has to come in exactly on the requested days', '申請通りの日に出社したい') },
        ],
        right: [['me', T('你来的两天我排在一起，中间那晚我去申请出差住宿补贴。', "I'll put your two days back-to-back, and I'll apply for a business-trip hotel allowance for the night in between.", '2日は連続で組むよ。間の一泊は出張の宿泊手当を申請しておく。')], ['them', T('……那就一趟新干线办两天的事。谢谢。', '…So one Shinkansen trip, two days of work. Thank you.', '……新幹線1往復で2日分、ですね。ありがとうございます。')]],
        wrong: [['them', T('……嗯，行吧。', '…Yeah, okay.', '……はい、まあ、いいですけど。')], ['them', T('（他关掉了摄像头）', '(He turns off his camera.)', '（彼はカメラをオフにした）')]],
      } },
    ],
  },
  tanaka: {
    lines: [
      ['them', T('对不起……我最近总是想在家。', 'Sorry… lately I keep wanting to stay home.', 'すみません……最近、家にいたくなってばかりで。')],
      ['me', T('不用道歉。最近怎么样？', 'No need to apologize. How have you been?', '謝らなくていいよ。最近どう？')],
      ['them', T('销售部的事之后，我在办公室总觉得大家在看我。问问题又怕被觉得没用。', "Since what happened in Sales, I feel like everyone's watching me at the office. And I'm scared that asking questions makes me look useless.", '営業部のことがあってから、オフィスでみんなに見られている気がして。質問すると役に立たないと思われそうで怖いんです。')],
      { choice: [
        { tag: 'empathy', label: T('在办公室的时候，最难受的是什么？', "What's the hardest part about being at the office?", 'オフィスにいて、一番つらいのは何？'), reply: [
          ['them', T('一个人坐在那里，卡住了也不知道问谁。', 'Sitting there alone, stuck, not knowing who to ask.', '一人で座ってて、詰まっても誰に聞けばいいか分からないことです。')],
          ['them', T('佐藤さん在的时候就不一样，他会自己走过来看。', "It's different when Sato-san is there. He comes over to check on me.", '佐藤さんがいる時は違うんです。自分から見に来てくれるので。')],
        ] },
        { tag: 'solve', label: T('那你申请的日子我都排上，多来几次就习惯了。', "Then I'll schedule all the days you asked for. You'll get used to it after a few times.", 'じゃあ申請の日は全部入れるよ。何回か来れば慣れるから。'), reply: [
          ['them', T('……嗯。', '…Okay.', '……はい。')],
          ['them', T('（他低头看着键盘）多来几次……就会好吗。', "(He looks down at his keyboard.) A few more times… and it'll get better?", '（キーボードに目を落として）……何回か来れば、よくなるんですかね。')],
        ] },
        { tag: 'wild', label: T('我给你做个「问题扭蛋机」，问一个问题出一颗糖？', 'What if I made you a question gacha machine? One question, one piece of candy?', '「質問ガチャ」を作ろうか？質問1回で飴が1個出てくる。'), reply: [
          ['them', T('那我会胖 10 公斤的……', "Then I'd gain 10 kilos…", 'それだと10キロ太っちゃいます……')],
          ['them', T('不过，要是佐藤さん在旁边，我应该敢问。', 'But if Sato-san were next to me, I think I could ask.', 'でも、佐藤さんが隣にいたら聞けると思います。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('那每天都跟佐藤一起来？', 'So come in with Sato every day?', 'じゃあ毎日佐藤さんと一緒に来る？'), reply: [
          ['them', T('每天都跟着他……他会烦的吧。', "Following him every day… he'd get sick of me.", '毎日くっついていたら……迷惑ですよね。')],
          ['them', T('而且我也想试试自己行不行。一周有一天就够了。', 'And I want to see if I can manage on my own too. One day a week is enough.', 'それに、自分でできるかも試してみたいんです。週1日あれば十分です。')],
        ] },
        { tag: 'solve', label: T('那你在家多看看文档吧。', 'Then read more of the docs at home.', 'じゃあ家でドキュメントをもっと読んだら？'), reply: [
          ['them', T('文档我都看过了……看不懂的地方才想问人。', "I've read all the docs… It's the parts I don't understand that I want to ask about.", 'ドキュメントは全部読みました……分からないところを人に聞きたいんです。')],
          ['them', T('攒一周的问题，找一天问佐藤さん，应该就够了。', "If I save up a week's worth of questions and ask Sato-san on one day, that should be enough.", '一週間分の質問をためて、1日で佐藤さんに聞ければ十分だと思います。')],
        ] },
        { tag: 'wild', label: T('要不我们给佐藤做个纸板立牌？', 'How about we make a cardboard cutout of Sato?', '佐藤さんの等身大パネルでも作る？'), reply: [
          ['them', T('（笑）那我可能真的会去问它。', '(laughs) I might actually ask it questions.', '（笑）本当に話しかけちゃうかもしれません。')],
          ['them', T('……其实一周有一天佐藤さん在就好，其他日子我想自己试试。', '…Really, one day a week with Sato-san is enough. The other days I want to try on my own.', '……実は週1日佐藤さんがいれば十分で、ほかの日は自分でやってみたいんです。')],
        ] },
      ] },
      ['them', T('佐藤さん说过，他当新人的时候也问过「git 是什么」。', 'Sato-san told me that when he was new, he once asked, "What\'s git?"', '佐藤さん、新人の頃に「gitって何ですか」って聞いたことがあるって言ってました。')],
      { ask: {
        options: [
          { text: T('和佐藤恰好有 1 天一起出社', 'Exactly 1 office day together with Sato', '佐藤さんと同じ出社日がちょうど1日'), ok: true },
          { text: T('每天都要和佐藤一起出社', 'Has to be in the office with Sato every day', '毎日佐藤さんと一緒に出社したい') },
          { text: T('办公室里至少要有 3 个人他才肯来', 'Only comes in if at least 3 people are in the office', 'オフィスに3人以上いないと来たくない') },
          { text: T('一定要按申请的日子来', 'Has to come in exactly on the requested days', '申請通りの日に出社したい') },
        ],
        right: [['me', T('每周排一天你和佐藤一起，那天攒着问题问他。其他日子你自己试试。', "Every week I'll put you in with Sato for one day. Save your questions for him that day. The other days, try on your own.", '毎週1日は佐藤さんと一緒にするから、その日にためた質問をして。ほかの日は自分でやってみて。')], ['them', T('……好。我会把问题记在本子上。', "…Okay. I'll write my questions down in a notebook.", '……はい。質問はノートに書いておきます。')]],
        wrong: [['them', T('……好的，我会努力的。', "…Okay, I'll do my best.", '……はい、頑張ります。')], ['them', T('（他的声音越来越小）', '(His voice gets quieter and quieter.)', '（声がだんだん小さくなっていく）')]],
      } },
    ],
  },
  abe: {
    lines: [
      ['them', T('你知道办公室为什么吵吗？', 'Do you know why the office is so loud?', 'オフィスがなんでうるさいか知ってる？')],
      ['me', T('……老王的键盘？', "…Wang's keyboard?", '……王さんのキーボード？')],
      ['them', T('青轴。他一紧张就打得更快。现在全公司都很紧张。', "Clicky switches. He types faster when he's stressed. And right now the whole company is stressed.", '青軸。あの人、緊張すると打つのが速くなるの。で、今は会社中が緊張してる。')],
      ['them', T('可作战室一开，错误提示的文案和接口都得跟他对。远程对了三次，三次都对错了。', 'But now that the war room is open, I have to work out the error copy and the API with him. We tried remotely three times and got it wrong three times.', 'でも作戦室が始まったら、エラーの文言もAPIもあの人と詰めなきゃいけない。リモートで3回やって、3回ともずれたんだよね。')],
      { choice: [
        { tag: 'empathy', label: T('所以你其实需要跟他见面？', 'So you actually need to meet him?', 'つまり、本当は彼と会う必要があるってこと？'), reply: [
          ['them', T('……一周见一次就够。', '…Once a week is enough.', '……週1回会えれば十分。')],
          ['them', T('见多了，我的耳朵受不了。', "Any more and my ears can't take it.", 'それ以上は耳がもたない。')],
        ] },
        { tag: 'solve', label: T('那就把你们俩排在同一天，越多越好。', "Then I'll put you two on the same days, as many as possible.", 'じゃあ2人を同じ日に、できるだけ多く入れよう。'), reply: [
          ['them', T('越多越好？', 'As many as possible?', 'できるだけ多く……？')],
          ['them', T('（她沉默了三秒）你是想让我画的按钮都尖叫吗。', '(She is silent for three seconds.) Do you want every button I draw to scream?', '（3秒の沈黙）私の描くボタン、全部悲鳴あげさせたいの？')],
        ] },
        { tag: 'wild', label: T('我去把老王的键盘换成电子琴。', "I'll swap Wang's keyboard for an electric piano.", '王さんのキーボードを電子ピアノに替えてくるよ。'), reply: [
          ['them', T('（笑）那他会开始弹肖邦。', "(laughs) Then he'd start playing Chopin.", '（笑）そしたらあの人、ショパン弾き出すよ。')],
          ['them', T('……说真的，接口必须当面对。一周一天就好。', '…Seriously, the API has to be done face to face. One day a week is fine.', '……真面目な話、APIは対面じゃないと無理。週1日あればいい。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('那其他日子呢？', 'And the other days?', 'じゃあほかの日は？'), reply: [
          ['them', T('其他日子我想离那个键盘远一点。在家画图最快。', 'The other days I want to be far away from that keyboard. I design fastest at home.', 'ほかの日は、あのキーボードから離れていたい。家で描くのが一番速いし。')],
        ] },
        { tag: 'solve', label: T('我给你申请一副降噪耳机。', "I'll request a pair of noise-cancelling headphones for you.", 'ノイキャンのヘッドホンを申請してあげるよ。'), reply: [
          ['them', T('耳机我有。戴一整天耳朵疼。', 'I have headphones. My ears hurt after wearing them all day.', 'ヘッドホンは持ってる。一日中つけてると耳が痛くなるの。')],
          ['them', T('一周一天的话，我可以忍。', 'One day a week, I can put up with.', '週1日なら、まあ我慢できる。')],
        ] },
        { tag: 'wild', label: T('要不你们俩用摩斯电码沟通？', 'What if you two talked in Morse code?', 'いっそ2人でモールス信号で話したら？'), reply: [
          ['them', T('他会用青轴敲给我。', "He'd tap it out on clicky switches.", 'あの人、青軸で打ってくるに決まってる。')],
          ['them', T('……一周就一天，对完接口我就回家。', '…One day a week. Once the API is sorted, I go home.', '……週1日だけね。APIを詰めたら帰るから。')],
        ] },
      ] },
      ['them', T('降噪耳机还是要的。', 'I still want the noise-cancelling headphones, though.', 'あ、ノイキャンのヘッドホンはやっぱり欲しい。')],
      { ask: {
        options: [
          { text: T('和老王恰好 1 天同时出社', 'Exactly 1 office day together with Wang', '王さんと同じ出社日がちょうど1日'), ok: true },
          { text: T('永远不和老王同一天出社', 'Never on the same day as Wang, ever', '王さんとは絶対に同じ日に出社しない') },
          { text: T('每次出社都要和老王一起', 'Every office day has to be with Wang', '出社する日は毎回王さんと一緒') },
          { text: T('一定要按申请的日子来', 'Has to come in exactly on the requested days', '申請通りの日に出社したい') },
        ],
        right: [['me', T('每周排一天你和老王一起，那天专门对接口。其他日子错开。', "Every week I'll put you in with Wang for one day, just for the API. The other days, I'll keep you apart.", '毎週1日は王さんと一緒にして、その日はAPIのすり合わせ専用。ほかの日はずらすよ。')], ['them', T('成交。再加一副降噪耳机。', 'Deal. Plus the noise-cancelling headphones.', '交渉成立。ノイキャンのヘッドホンもよろしく。')]],
        wrong: [['them', T('……行吧。', '…Fine.', '……まあ、いいけど。')], ['them', T('（她把耳机戴上了）', '(She puts her headphones on.)', '（彼女はヘッドホンをつけた）')]],
      } },
    ],
  },
  sato: {
    lines: [
      ['me', T('佐藤さん，最近还好吗？', 'Sato-san, how are you holding up?', '佐藤さん、最近大丈夫？')],
      ['them', T('……还好。', "…I'm okay.", '……まあ、なんとか。')],
      ['them', T('我爸的复健上周结束了，周一终于不用跑医院了。', "My dad finished rehab last week. I finally don't have to go to the hospital on Mondays.", '父のリハビリが先週終わってね。月曜にやっと病院に行かなくてよくなった。')],
      ['them', T('只是事故以后，我每天复盘到 11 点，周末也在。一来办公室，大家都来问我。被需要我很高兴，可我一行代码都写不了。', "It's just that since the incident, I've been doing postmortem work until 11 every night, weekends too. And whenever I'm at the office, everyone comes to me with questions. I'm glad to be needed, but I can't write a single line of code.", 'ただ、障害からずっと、毎晩11時まで振り返りで、週末もやってる。オフィスに行けばみんなが質問しに来る。頼られるのは嬉しいんだけど、コードが一行も書けないんだ。')],
      { choice: [
        { tag: 'empathy', label: T('你上次好好写代码是什么时候？', 'When was the last time you got to really write code?', '最後にちゃんとコードを書いたのはいつ？'), reply: [
          ['them', T('……不记得了。', "…I don't remember.", '……覚えてない。')],
          ['them', T('好像是事故前一周的周五。那天没有会，也没人找我。', 'Maybe the Friday the week before the incident. No meetings, and nobody came looking for me.', '障害の前の週の金曜、かな。会議もなくて、誰にも話しかけられなかった日。')],
        ] },
        { tag: 'solve', label: T('那周一也能来了，你申请的日子我都排上。', "Then you can come in on Mondays now too. I'll schedule all the days you asked for.", 'じゃあ月曜も来られるね。申請の日は全部入れるよ。'), reply: [
          ['them', T('嗯。周一周二周三都行。', 'Yeah. Monday, Tuesday, Wednesday, any of them.', 'うん。月火水、どれでもいいよ。')],
          ['them', T('（他揉了揉眼睛）……只要别让我五天都在被人问就好。', "(He rubs his eyes.) …As long as I'm not answering questions all five days.", '（目をこすりながら）……5日間ずっと質問攻めにならなければ、それでいい。')],
        ] },
        { tag: 'wild', label: T('做一个佐藤的纸板立牌放在办公室，让大家去问它。', "Let's put a cardboard cutout of you in the office and have everyone ask it instead.", '佐藤さんの等身大パネルをオフィスに置いて、みんなにはそっちに聞いてもらおう。'), reply: [
          ['them', T('田中大概真的会去问它。', 'Tanaka would probably actually ask it.', '田中は本当に話しかけそうだな。')],
          ['them', T('……其实我只需要一天，安安静静地写代码。周五最好，周五没有会。', '…Honestly, I just need one quiet day to write code. Friday would be best. There are no meetings on Friday.', '……本当は、1日だけ静かにコードを書ける日があればいいんだ。金曜がいいな。金曜は会議がないから。')],
        ] },
      ] },
      { choice: [
        { tag: 'empathy', label: T('当初是你第一个说「先按要求来」的吧。', 'You were the first one to say "let\'s just follow the rules," weren\'t you.', '最初に「まずはルール通りにやろう」って言ったの、佐藤さんだったよね。'), reply: [
          ['them', T('是我。所以我不想第一个说不行。', "It was me. That's why I don't want to be the first to say I can't.", '僕だね。だから、自分が最初に無理って言うわけにはいかないんだ。')],
        ] },
        { tag: 'solve', label: T('再坚持一下，评分快回来了。', 'Hang in there a little longer. The rating is almost back.', 'もう少しの辛抱だよ。評価はもうすぐ戻る。'), reply: [
          ['them', T('……我知道。', '…I know.', '……分かってる。')],
          ['them', T('我只是想要一天，不用回答任何问题。', "I just want one day where I don't have to answer any questions.", 'ただ、質問に一つも答えなくていい日が1日欲しいだけなんだ。')],
        ] },
        { tag: 'wild', label: T('我们发明一个「佐藤免打扰日」，写进公司日历。', 'Let\'s invent a "Sato Do-Not-Disturb Day" and put it on the company calendar.', '「佐藤さん話しかけ禁止デー」を作って、会社のカレンダーに入れよう。'), reply: [
          ['them', T('（笑）黑田会问那天的出勤率是多少。', '(laughs) Kuroda would ask what the attendance rate is on that day.', '（笑）黒田さんに「その日の出社率は？」って聞かれるよ。')],
          ['them', T('……不过，要是周五能在家，我真的能喘口气。', "…But if I could be home on Fridays, I'd really be able to breathe.", '……でも、金曜に家にいられたら、本当に一息つける。')],
        ] },
      ] },
      ['them', T('这些话我还没跟任何人说过。', "I haven't told anyone any of this.", 'この話、まだ誰にもしてないんだ。')],
      { ask: {
        options: [
          { text: T('周五在家，那天谁都别找他', 'Remote on Friday, and nobody bothers him that day', '金曜は在宅、その日は誰も話しかけない'), ok: true },
          { text: T('周一还是要在家陪父亲', 'Still has to be home on Monday for his father', '月曜はまだ父親のために在宅が必要') },
          { text: T('一周最多来两天', 'Comes in at most two days a week', '出社は週2日まで') },
          { text: T('一定要按申请的日子来', 'Has to come in exactly on the requested days', '申請通りの日に出社したい') },
        ],
        right: [['me', T('周五你在家，那天谁都不许找你，包括我。', "You're home on Fridays, and nobody is allowed to bother you that day. Including me.", '金曜は在宅。その日は誰も話しかけちゃダメ。私も含めて。')], ['them', T('包括你？', 'Including you?', 'マネージャーも？')], ['me', T('包括我。', 'Including me.', '私も。')], ['them', T('……谢谢。这是我这个月第一次觉得能喘口气。', "…Thank you. That's the first time this month I've felt like I can breathe.", '……ありがとう。今月に入って、初めてちゃんと息ができた気がする。')]],
        wrong: [['them', T('……嗯，我会撑住的。', "…Yeah, I'll hang in there.", '……うん、なんとか持ちこたえるよ。')], ['them', T('（他笑了一下，但没有笑出声）', '(He smiles, but without making a sound.)', '（彼は少し笑ったが、声は出なかった）')]],
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
  1: { name: T('周五 CFO 来了', 'The CFO came on Friday', '金曜にCFOが来た'), lines: [
    ['abe', T('CFO 真的来了，在工位区站了五分钟', 'The CFO really came. Stood in the desk area for five minutes', 'CFO、本当に来た。席の近くで5分くらい立ってたよ')],
    ['tanaka', T('她还问我在写什么……我说在写测试', 'She even asked what I was writing… I said tests', '何を書いてるのか聞かれました……テストですって答えました')],
    ['sato', T('写测试是好事', 'Writing tests is a good thing', 'テストを書くのはいいことだよ')],
    M('tanaka'),
    ['wang', T('她有没有看到我的键盘', 'Did she see my keyboard', '俺のキーボード、見られた？')],
    ['abe', T('看到了，她皱了一下眉', 'She did. She frowned a little', '見てた。一瞬眉ひそめてたよ')],
    M('abe'), M('wang'),
    ['suzuki', T('网线终于布好了吗？上次来连 Wi-Fi 都断', 'Is the network finally set up? Last time even the Wi-Fi kept dropping', 'LANやっと引けた？前回はWi-Fiまで落ちてたけど')],
    M('suzuki'), M('kobayashi'),
    ['sato', T('听说下周开始要抽查了', 'I heard spot checks start next week', '来週から抜き打ちチェックが始まるらしいよ')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  2: { name: T('抽查周', 'Spot-check week', '抜き打ちチェックの週'), lines: [
    ['wang', T('CFO 这周抽查了三次。每次都站在门口数人头', 'The CFO did three spot checks this week. Stood at the door counting heads every time', 'CFO、今週3回も抜き打ち来たよ。毎回入口で人数数えてる')],
    ['abe', T('数到我的时候还点了点头，莫名紧张', 'She nodded when she counted me. Weirdly nerve-racking', '私を数えた時、うなずいてた。なんか緊張したんだけど')],
    M('abe'),
    ['tanaka', T('销售部那边空了好多桌子……', 'So many empty desks over in Sales…', '営業部のほう、空いてる席がすごく増えてて……')],
    ['sato', T('山本さん那排已经被总务部贴上封条了', "General Affairs has already taped off Yamamoto-san's row", '山本さんの列、総務部がもうテープで封鎖してた')],
    M('tanaka'), M('sato'),
    ['kobayashi', T('听说下个月咖啡也要停了？', 'I heard the coffee is ending next month too?', '来月からコーヒーも止まるって、本当？')],
    ['suzuki', T('那我只能从长野带茶包来了', "Then I guess I'll bring tea bags from Nagano", 'じゃあ長野からお茶っ葉持ってくるしかないな')],
    M('suzuki'), M('kobayashi'), M('wang'),
    ...ALL_SECOND,
  ] },
  3: { name: T('没有咖啡的一周', 'The Week Without Coffee', 'コーヒーのない週'), lines: [
    ['abe', T('周四 CFO 带了三个董事来参观，在我工位后面站了好久', 'On Thursday the CFO brought three board members on a tour. They stood behind my desk forever', '木曜、CFOが取締役3人連れてきて、私の席の後ろにずーっと立ってた')],
    ['wang', T('他们问我键盘是不是公司配的', 'They asked if my keyboard was company-issued', 'キーボード、会社支給ですかって聞かれた')],
    ['abe', T('你怎么说', 'What did you say', 'なんて答えたの')],
    ['wang', T('我说是我自己的，青轴，很提神', "I said it's mine. Clicky. Keeps you awake", '自前です、青軸です、眠気覚ましにいいですよって')],
    M('abe'), M('wang'),
    ['tanaka', T('我的挂耳包已经被拿光了……', 'My drip coffee bags are all gone…', '僕のドリップバッグ、全部なくなってました……')],
    ['sato', T('谁拿的自觉一点', 'Whoever took them, you know who you are', '取った人、心当たりあるよね')],
    M('tanaka'), M('sato'),
    ['suzuki', T('这个月的交通费报销单退回来了。超了上限', 'My commuting expense claim got sent back this month. Over the cap', '今月の交通費精算、差し戻された。上限超え')],
    M('suzuki'),
    ['kobayashi', T('总务部说下个月连打印纸都要申请', "General Affairs says next month we'll need to request printer paper too", '総務部が、来月からコピー用紙も申請制にするって')],
    M('kobayashi'),
    ...ALL_SECOND,
  ] },
  4: { name: T('出勤日报', 'Daily attendance report', '出社率の日報'), lines: [
    ['kobayashi', T('出勤率现在每天都贴在电梯口了', 'Attendance is now posted by the elevators every day', '出社率、毎日エレベーター前に貼られるようになったね')],
    ['abe', T('开发二组那一栏用的是红色字体', "Dev Team 2's row is in red", '開発2課の欄だけ赤字なんだけど')],
    M('kobayashi'), M('abe'),
    ['wang', T('周三要发新版本，同步模块大改', 'New release Wednesday. Big changes to the sync module', '水曜に新バージョン出すよ。同期モジュールをがっつり変えた')],
    ['sato', T('迁移脚本多测一遍吧', 'Test the migration script one more time', 'マイグレーションスクリプト、もう一回テストしておこうか')],
    ['wang', T('测过了。……大概', 'Tested it. …Probably', 'テストはした。……たぶん')],
    M('wang'), M('sato'),
    ['tanaka', T('佐藤さん，周三我能在旁边看你们发版吗', 'Sato-san, can I watch you all do the release on Wednesday?', '佐藤さん、水曜のリリース、横で見ててもいいですか')],
    M('tanaka'),
    ['suzuki', T('发版那天我盯监控。有事叫我', "I'll watch the monitors on release day. Call me if anything happens", 'リリース当日は監視してる。何かあったら呼んで')],
    M('suzuki'),
    ...ALL_SECOND,
  ] },
  5: { name: T('作战室第一周', 'War room, week one', '作戦室、最初の週'), lines: [
    ['suzuki', T('作战室的白板写满了。昨晚修了 14 个 bug', 'The war-room whiteboard is full. Fixed 14 bugs last night', '作戦室のホワイトボードが埋まった。昨夜バグを14件直した')],
    ['wang', T('还剩 31 个', '31 to go', 'あと31件')],
    M('suzuki'), M('wang'),
    ['tanaka', T('佐藤さん今天被问了多少个问题啊', 'How many questions did Sato-san get asked today?', '佐藤さん、今日何回質問されたんでしょう')],
    ['abe', T('我数了，47 个。其中 12 个是你问的', 'I counted. 47. Twelve of them were yours', '数えた。47回。そのうち12回は田中くんね')],
    ['tanaka', T('……对不起', '…Sorry', '……すみません')],
    M('tanaka'), M('abe'),
    ['kobayashi', T('客户那边暂时稳住了。下周还要再去一次', 'The clients have calmed down for now. I have to go again next week', 'お客さんのほうは、ひとまず落ち着いた。来週もう一回行ってくる')],
    M('kobayashi'),
    ['sato', T('没事。大家有问题随时问', "It's fine. Ask me anything, anytime", '大丈夫。質問があったらいつでも聞いて')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  6: { name: T('复盘会', 'The postmortem', '振り返り会'), lines: [
    ['abe', T('佐藤さん昨天又是 11 点才下线', 'Sato-san logged off at 11 again yesterday', '佐藤さん、昨日もオフラインになったの11時だったよ')],
    ['wang', T('前天是 12 点', 'The day before, it was midnight', '一昨日は12時だった')],
    ['kobayashi', T('他周末也在线。我看到他凌晨两点还在改复盘文档', "He's online on weekends too. I saw him editing the postmortem doc at 2 a.m.", '佐藤さん、週末もオンラインだったよ。夜中の2時に振り返りドキュメント直してた')],
    M('abe'), M('wang'), M('kobayashi'),
    ['tanaka', T('我想帮忙，可是我连复盘文档都看不太懂……', 'I want to help, but I can barely understand the postmortem doc…', '手伝いたいんですけど、振り返りドキュメントもまだよく分からなくて……')],
    M('tanaka'),
    ['suzuki', T('评分 2.6 了。在往上走', "Rating's at 2.6. Going up", '評価2.6。上がってきてる')],
    M('suzuki'),
    ['sato', T('……我没事。', "…I'm fine.", '……大丈夫だよ。')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  7: { name: T('评分 3.4', 'Rating 3.4', '評価3.4'), lines: [
    ['suzuki', T('评分 3.4。这周差评少了一半', 'Rating 3.4. Half as many bad reviews this week', '評価3.4。今週は低評価が半分に減った')],
    ['abe', T('新的错误提示上线了。用户说「终于看得懂了」', 'The new error messages are live. Users say "finally, I can understand them"', '新しいエラーメッセージ出したよ。「やっと意味が分かる」ってレビュー来てた')],
    M('suzuki'), M('abe'),
    ['tanaka', T('我第一次一个人修好了一个 bug！', 'I fixed a bug all by myself for the first time!', '初めて一人でバグを直せました！')],
    ['wang', T('合进去之前我看过了。写得不错', 'I looked at it before it got merged. Nice work', 'マージ前に見たけど、よく書けてた')],
    M('tanaka'), M('wang'),
    ['kobayashi', T('听说森さん这周在跟投资方开会', 'I heard Mori-san is meeting the investors this week', '森さん、今週は投資家と会議らしいよ')],
    M('kobayashi'),
    ['sato', T('……周五我会准时下线', "…I'll log off on time Friday", '……金曜は定時で上がるよ')],
    M('sato'),
    ...ALL_SECOND,
  ] },
  8: { name: T('最后一周作战室', 'The Last War-Room Week', '作戦室、最後の週'), lines: [
    ['wang', T('最后一个崩溃修掉了', 'Fixed the last crash', '最後のクラッシュ、潰した')],
    ['suzuki', T('监控全绿。我拍下来了', 'Monitors all green. I took a picture', '監視、オールグリーン。写真撮った')],
    M('wang'), M('suzuki'),
    ['abe', T('作战室的白板谁来擦', "Who's wiping the war-room whiteboard", '作戦室のホワイトボード、誰が消す？')],
    ['tanaka', T('我来！我想留一张照片再擦', 'Me! I want to take a photo first', '僕がやります！先に写真を撮ってから')],
    M('abe'), M('tanaka'),
    ['kobayashi', T('评分……我不敢看', "The rating… I'm scared to look", '評価……怖くて見られない')],
    ['sato', T('我也是', 'Me too', '僕も')],
    M('kobayashi'), M('sato'),
    ...ALL_SECOND,
  ] },
  9: { name: T('All Hands 当天', 'All Hands day', 'All Hands当日'), lines: [
    ['tanaka', T('我是不是来太早了，会场只有我一个人', "Am I too early? I'm the only one here", '早く来すぎましたかね、会場に僕しかいません')],
    ['sato', T('我也到了。在门口', "I'm here too. At the door", '僕ももう着いてるよ。入口のとこ')],
    M('tanaka'), M('sato'),
    ['suzuki', T('昨晚住的酒店离公司五分钟。这是我第一次走路上班', "Last night's hotel was five minutes from the office. First time I've ever walked to work", '昨夜のホテル、会社まで徒歩5分。歩いて出勤なんて初めて')],
    ['kobayashi', T('孩子们说要看合影', 'The kids want to see the group photo', '子どもたちが、集合写真見せてって')],
    M('suzuki'), M('kobayashi'),
    ['wang', T('我带了静音键盘过来。以防万一', 'I brought the quiet keyboard. Just in case', '静音キーボード持ってきた。一応ね')],
    ['abe', T('以防什么万一', 'In case of what', '一応って、何の？')],
    M('wang'), M('abe'),
    ...ALL_SECOND,
  ] },
};

export const MOOD_LINES = {
  kobayashi: { happy: [T('这周按时接到孩子了🙏', 'Picked the kids up on time this week 🙏', '今週はお迎えに間に合った🙏'), T('下午还陪他们去游了泳', 'Even took them swimming in the afternoon', '午後はプールにも一緒に行けた')], meh: [T('周三被排进来了……婆婆帮忙接的孩子', 'I got scheduled on Wednesday… My mother-in-law picked up the kids', '水曜が入っちゃって……お迎えは義母に頼んだ'), T('下次不一定找得到人帮忙', 'I might not find anyone to help next time', '次も頼めるとは限らないんだけど')], angry: [T('这周排的日子我都走不开', "I couldn't get away on any of the days I was scheduled this week", '今週の出社日、どの日も抜けられなくて'), T('我再想想办法吧……', "I'll try to figure something out…", 'なんとか考えてみる……')] },
  sato: { happy: [T('我这周挺顺的', 'This week went pretty smoothly for me', '今週はわりと順調だった'), T('陪我爸去复健也赶上了', "Made it to my dad's rehab too", '父のリハビリの付き添いにも間に合った')], meh: [T('周一早上从医院直接赶过来的', 'Came straight from the hospital on Monday morning', '月曜の朝は病院から直行だった'), T('还行，就是有点累', "It's okay. Just a little tired", 'まあ大丈夫。ちょっと疲れただけ')], angry: [T('……这周有点累', '…A bit tired this week', '……今週はちょっと疲れた'), T('周一那天我爸是一个人去的医院', 'My dad went to the hospital alone on Monday', '月曜、父を一人で病院に行かせちゃった')] },
  tanaka: { happy: [T('佐藤さん在的那天，我问了好多问题！', 'I asked so many questions on the day Sato-san was in!', '佐藤さんがいた日、たくさん質問できました！'), T('其他日子自己查文档，也慢慢习惯了', "The other days I looked things up in the docs. I'm getting used to it", 'ほかの日は自分でドキュメントを調べて、少しずつ慣れてきました')], meh: [T('今天一个人在办公室，不知道该问谁……', "I was alone in the office today, didn't know who to ask…", '今日はオフィスに一人で、誰に聞けばいいか分からなくて……'), T('佐藤さん那天怎么没来呀', "Why wasn't Sato-san in that day…", '佐藤さん、あの日はなんでいなかったんだろう……')], angry: [T('这周我好像一直是一个人……', 'I feel like I was alone the whole week…', '今週はずっと一人だった気がします……'), T('要么就是一直跟着佐藤さん，他好像也有点烦我了', "Or else I was following Sato-san around the whole time. I think he's getting tired of me", 'じゃなきゃずっと佐藤さんにくっついてて、ちょっと迷惑そうでした')] },
  wang: { happy: [T('这周作息没崩，难得', "Sleep schedule didn't collapse this week. Rare", '今週は生活リズム崩れなかった。珍しく'), T('隔一天来一次，刚好', 'Every other day is just right', '1日おきの出社、ちょうどいいわ')], meh: [T('周初就来公司……我现在看代码是重影的', "Came in at the start of the week… I'm seeing double in the code now", '週の頭から出社……コードが二重に見える'), T('下次周一周二饶了我吧', 'Spare me Monday and Tuesday next time', '次は月火だけは勘弁して')], angry: [T('我已经不知道今天星期几了', "I don't even know what day it is anymore", 'もう今日が何曜日かも分からない'), T('这周的班是谁排的', "Who made this week's schedule", '今週のシフト組んだの誰？')] },
  abe: { happy: [T('这周耳根清净，图画得特别顺', 'Peace and quiet this week. The designs came together so easily', '今週は静かで、デザインがすごく捗った'), T('设计稿提前一天交了', 'Handed in the designs a day early', 'デザイン、1日早く出せた')], meh: [T('旁边一直有键盘声……算了', 'Keyboard noise next to me all day… whatever', '隣でずっとカチャカチャ……もういいや'), T('戴了一整天耳机，耳朵疼', 'Wore headphones all day. My ears hurt', '一日中ヘッドホンしてて耳が痛い')], angry: [T('青轴键盘陪了我一整天', 'Spent the whole day with a clicky keyboard', '一日中、青軸のBGM付きだった'), T('我申请的日子也没给我', "And I didn't even get the days I asked for", '申請した日も入れてもらえなかったし')] },
  suzuki: { happy: [T('这周一趟新干线办完两天的事，划算', 'One Shinkansen trip for two days of work this week. Good deal', '今週は新幹線1往復で2日分。コスパ良し'), T('晚上在东京吃了拉面', 'Had ramen in Tokyo at night', '夜は東京でラーメン食べた')], meh: [T('这周跑了两趟长野和东京，有点累', 'Two round trips between Nagano and Tokyo this week. A bit tired', '今週は長野と東京を2往復。ちょっと疲れた'), T('交通费又要超了', "I'm going over the commuting cap again", 'また交通費が上限超えそう')], angry: [T('新干线来回两趟，这个月的交通费已经超了……', "Two Shinkansen round trips. I'm already over this month's commuting cap…", '新幹線2往復で、今月の交通費もう上限超え……'), T('申请的日子也没排上，白跑一趟', "And I didn't get the days I asked for. The trip was for nothing", '申請した日も入らなかったし、無駄足だった')] },
  'tanaka@5': { happy: [T('这周两天都有佐藤さん在，问题全清空了！', 'Sato-san was in on both days this week. I cleared out all my questions!', '今週は2日とも佐藤さんがいて、質問を全部解消できました！'), T('第三天我自己修了一个 bug', 'On the third day I fixed a bug on my own', '3日目は自分でバグを1件直しました')], meh: [T('这周跟佐藤さん一起的日子不太对……', "My days with Sato-san this week weren't quite right…", '今週は佐藤さんと一緒の日がうまく合わなくて……'), T('要么一个人卡着，要么一直跟着他', 'Either I was stuck alone, or I was following him around all day', '一人で詰まるか、ずっとくっついてるかのどっちかでした')], angry: [T('这周我好像一直是一个人……', 'I feel like I was alone the whole week…', '今週はずっと一人だった気がします……'), T('申请的日子也没排上', "And I didn't get the days I asked for", '申請した日も入りませんでした')] },
  'wang@5': { happy: [T('三天都没连着，作息还撑得住', 'None of the three days were back-to-back. My sleep is holding up', '3日とも連続じゃなかったから、生活リズムはなんとか持ってる'), T('难得', 'Rare', '珍しく')], meh: [T('这周的排班，我的作息崩了', "This week's schedule wrecked my sleep", '今週のシフトで生活リズム崩壊した'), T('周一或者连着三天，哪个都要命', 'Monday or three days in a row, either one kills me', '月曜か3連続、どっちも無理なんだって')], angry: [T('我已经不知道今天星期几了', "I don't even know what day it is anymore", 'もう今日が何曜日かも分からない'), T('这周的班是谁排的', "Who made this week's schedule", '今週のシフト組んだの誰？')] },
  'abe@5': { happy: [T('和老王当面对了一天接口，剩下的日子耳根清净', 'Spent one day sorting out the API with Wang in person. Peace and quiet the rest of the week', '王さんと1日対面でAPI詰めて、残りの日は静かだった'), T('错误提示的文案改完了', 'Finished rewriting the error messages', 'エラーメッセージの文言、直し終わった')], meh: [T('接口还是没当面对好……', "Still haven't sorted out the API in person…", 'APIはまだ対面で詰められてない……'), T('要么见不到老王，要么被键盘声包围好几天', "Either I can't see Wang at all, or I'm surrounded by keyboard noise for days", '王さんに会えないか、何日もカチャカチャに囲まれるか')], angry: [T('这周不是见不到老王，就是天天听他的键盘', "This week I either couldn't see Wang, or had to listen to his keyboard every day", '今週は、王さんに会えないか、毎日あのカチャカチャを聞くかのどっちかだった'), T('申请的日子也没给我', "And I didn't get the days I asked for", '申請した日も入れてもらえなかったし')] },
  'sato@7': { happy: [T('周五在家写了一整天代码', 'Wrote code at home all day Friday', '金曜は家で一日中コード書けた'), T('没有人找我。谢谢', 'Nobody bothered me. Thank you', '誰にも呼ばれなかった。ありがとう')], meh: [T('周五还是在办公室……被问了一天问题', 'Still at the office Friday… answered questions all day', '金曜もオフィスだった……一日中質問対応'), T('下周再说吧', 'Maybe next week', 'まあ、来週かな')], angry: [T('……这周有点累', '…A bit tired this week', '……今週はちょっと疲れた'), T('周五也没能歇一下', "Didn't get a break on Friday either", '金曜も息つく暇がなかった')] },
  'wang@9': { happy: [T('这周连着来也撑住了，为了合影', 'Back-to-back days this week and I survived. For the photo', '今週は連続出社でもなんとか耐えた。集合写真のためにね'), T('周一照样补了觉', 'Still slept in on Monday', '月曜はいつも通り寝てた')], meh: [T('周一还是来了……', 'Ended up coming in on Monday anyway…', '結局月曜も来た……'), T('合影里我大概是闭着眼的', "I'll probably have my eyes closed in the photo", '集合写真、たぶん俺だけ目つぶってる')], angry: [T('我已经不知道今天星期几了', "I don't even know what day it is anymore", 'もう今日が何曜日かも分からない'), T('这周的班是谁排的', "Who made this week's schedule", '今週のシフト組んだの誰？')] },
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
