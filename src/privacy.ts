import type { Locale } from "./i18n";

export interface PrivacyPolicy {
  title: string;
  linkLabel: string;
  intro: string;
  sections: { heading: string; body?: string; table?: { head: [string, string, string]; rows: [string, string, string][] } }[];
  enacted: string;
}

const link = (href: string, label: string) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;

const GOOGLE_PARTNER = "https://policies.google.com/technologies/partner-sites";
const GA_OPTOUT = "https://tools.google.com/dlpage/gaoptout";
const GOOGLE_PRIVACY = "https://policies.google.com/privacy";

// Bodies are trusted static HTML; `{email}` is replaced with the contact link at render time.
export const PRIVACY: Record<Locale, PrivacyPolicy> = {
  ja: {
    title: "プライバシーポリシー",
    linkLabel: "プライバシーポリシー",
    intro:
      "グラタンゲーム（以下「当サイト」）は、個人が運営するゲームサイトです。当サイトおよび当サイトで公開しているゲームにおける情報の取り扱いについて、以下のとおり定めます。",
    sections: [
      {
        heading: "1. 運営者・お問い合わせ先",
        body: "運営者：グラタンゲーム（個人運営）<br>お問い合わせ：{email}",
      },
      {
        heading: "2. 収集する情報",
        body: "当サイトでは、氏名やメールアドレスなど、個人を特定できる情報の入力を求めることはありません。",
      },
      {
        heading: "3. ブラウザ内に保存する情報",
        body: "表示言語やゲームの進行状況は、お使いのブラウザのローカルストレージにのみ保存されます。これらの情報が当サイトや第三者に送信されることはありません。ブラウザのサイトデータを削除すると消去されます。",
      },
      {
        heading: "4. アクセス解析ツール（Google Analytics）",
        body: `当サイトは、サイトの改善のために Google LLC が提供する Google Analytics を利用しています。Google Analytics は Cookie を使用して、閲覧したページ、参照元、ブラウザや端末の種類、おおよその地域などの情報を収集します。これらの情報に、個人を特定できる情報は含まれません。<br>Google によるデータの取り扱いについては、${link(`${GOOGLE_PARTNER}?hl=ja`, "Google のサービスを使用するサイトやアプリから収集した情報の Google による使用")}をご覧ください。${link(`${GA_OPTOUT}?hl=ja`, "Google アナリティクス オプトアウト アドオン")}を利用すると、データの収集を無効にできます。`,
      },
      {
        heading: "5. Web フォント（Google Fonts）",
        body: "文字の表示に Google Fonts を利用しています。フォントを読み込む際、お使いの IP アドレスやブラウザの情報が Google に送信されます。",
      },
      {
        heading: "6. メールでのお問い合わせ",
        body: "メールでいただいたメールアドレスや内容は、返信および当サイトの改善のためにのみ使用し、法令に基づく場合を除き、第三者に提供することはありません。",
      },
      {
        heading: "7. 外部送信について",
        table: {
          head: ["送信先", "送信される情報", "利用目的"],
          rows: [
            ["Google Analytics（Google LLC）", "閲覧ページの URL、参照元、ブラウザ・端末の情報、Cookie ID、IP アドレス", "アクセス状況の分析"],
            ["Google Fonts（Google LLC）", "IP アドレス、ブラウザの情報、読み込むフォント", "Web フォントの配信"],
          ],
        },
      },
      {
        heading: "8. ポリシーの改定",
        body: "本ポリシーは、必要に応じて改定することがあります。改定後のポリシーは、本ページに掲載した時点から効力を生じるものとします。",
      },
    ],
    enacted: `送信先のプライバシーポリシー：${link(`${GOOGLE_PRIVACY}?hl=ja`, "Google プライバシーポリシー")}<br>制定日：2026年10月3日`,
  },
  zh: {
    title: "隐私政策",
    linkLabel: "隐私政策",
    intro:
      "グラタンゲーム（以下简称「本站」）是由个人运营的游戏网站。关于本站及本站发布的游戏如何处理信息，说明如下。",
    sections: [
      {
        heading: "1. 运营者与联系方式",
        body: "运营者：グラタンゲーム（个人运营）<br>联系方式：{email}",
      },
      {
        heading: "2. 收集的信息",
        body: "本站不会要求你填写姓名、邮箱等能识别个人身份的信息。",
      },
      {
        heading: "3. 保存在浏览器中的信息",
        body: "显示语言和游戏进度只保存在你浏览器的本地存储（localStorage）中，不会发送给本站或任何第三方。清除浏览器的网站数据后即会删除。",
      },
      {
        heading: "4. 访问分析工具（Google Analytics）",
        body: `为了改进网站，本站使用 Google LLC 提供的 Google Analytics。Google Analytics 通过 Cookie 收集浏览的页面、来源、浏览器和设备类型、大致地区等信息，这些信息不包含能识别个人身份的内容。<br>Google 如何处理这些数据，请参阅${link(`${GOOGLE_PARTNER}?hl=zh-CN`, "Google 如何使用来自使用其服务的网站或应用的信息")}。安装 ${link(`${GA_OPTOUT}?hl=zh-CN`, "Google Analytics 停用浏览器插件")}即可停止数据收集。`,
      },
      {
        heading: "5. 网页字体（Google Fonts）",
        body: "本站使用 Google Fonts 显示文字。加载字体时，你的 IP 地址和浏览器信息会发送给 Google。",
      },
      {
        heading: "6. 邮件咨询",
        body: "通过邮件收到的邮箱地址和内容，仅用于回复和改进本站。除法律要求外，不会提供给第三方。",
      },
      {
        heading: "7. 外部传输说明",
        table: {
          head: ["发送对象", "发送的信息", "使用目的"],
          rows: [
            ["Google Analytics（Google LLC）", "浏览页面的 URL、来源、浏览器和设备信息、Cookie ID、IP 地址", "分析访问情况"],
            ["Google Fonts（Google LLC）", "IP 地址、浏览器信息、加载的字体", "提供网页字体"],
          ],
        },
      },
      {
        heading: "8. 政策变更",
        body: "本政策可能会根据需要进行修改。修改后的政策自在本页面发布之时起生效。",
      },
    ],
    enacted: `发送对象的隐私政策：${link(`${GOOGLE_PRIVACY}?hl=zh-CN`, "Google 隐私权政策")}<br>制定日期：2026 年 10 月 3 日`,
  },
  en: {
    title: "Privacy Policy",
    linkLabel: "Privacy Policy",
    intro:
      "Gratin Game (グラタンゲーム, “this site”) is a game site run by an individual. This policy explains how information is handled on this site and in the games it publishes.",
    sections: [
      {
        heading: "1. Operator and contact",
        body: "Operator: Gratin Game (run by an individual)<br>Contact: {email}",
      },
      {
        heading: "2. Information we collect",
        body: "This site never asks you to enter information that identifies you, such as your name or email address.",
      },
      {
        heading: "3. Information stored in your browser",
        body: "Your language setting and game progress are stored only in your browser’s local storage. They are never sent to this site or to any third party, and are removed when you clear the site data in your browser.",
      },
      {
        heading: "4. Analytics (Google Analytics)",
        body: `To improve the site, we use Google Analytics, provided by Google LLC. Google Analytics uses cookies to collect information such as the pages you view, the referring site, your browser and device type, and your approximate region. This information does not identify you personally.<br>See ${link(GOOGLE_PARTNER, "How Google uses information from sites or apps that use its services")} for how Google handles this data. You can opt out with the ${link(GA_OPTOUT, "Google Analytics Opt-out Browser Add-on")}.`,
      },
      {
        heading: "5. Web fonts (Google Fonts)",
        body: "We use Google Fonts to display text. When the fonts load, your IP address and browser information are sent to Google.",
      },
      {
        heading: "6. Email enquiries",
        body: "The email address and message you send us are used only to reply and to improve this site, and are not shared with third parties except where required by law.",
      },
      {
        heading: "7. Data sent to third parties",
        table: {
          head: ["Recipient", "Information sent", "Purpose"],
          rows: [
            ["Google Analytics (Google LLC)", "Page URL, referrer, browser and device information, cookie ID, IP address", "Analysing site traffic"],
            ["Google Fonts (Google LLC)", "IP address, browser information, requested fonts", "Delivering web fonts"],
          ],
        },
      },
      {
        heading: "8. Changes to this policy",
        body: "We may update this policy when needed. The updated policy takes effect as soon as it is posted on this page.",
      },
    ],
    enacted: `Recipient’s privacy policy: ${link(GOOGLE_PRIVACY, "Google Privacy Policy")}<br>Effective: October 3, 2026`,
  },
};
