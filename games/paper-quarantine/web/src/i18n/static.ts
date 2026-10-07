import { LOCALE, LOCALE_LABELS, LOCALES, saveLocale, tr, type Locale } from "./locale";

const STATIC: Record<string, string> = tr({
  zh: {
    gameName: "纸上防疫",
    stageLabel: "纸质地图上的防疫行动",
    ap: "行动点",
    outbreaks: "爆发",
    cures: "解药",
    lastInfected: "上轮感染",
    rules: "规则说明",
    menu: "菜单",
    chooseAction: "选择行动",
    undo: "撤销",
    endTurn: "结束行动",
    fast: "快进",
    cancel: "取消",
    epidemicBang: "流行病！",
    draftTitle: "选择两名队员",
    draftLead: "从 8 名队员中选 2 名出发。",
    back: "返回",
    draftGo: "确认出发",
    startGame: "开始游戏",
    startGameNote: "新的一局 · 约 15 分钟",
    tutorial: "新手教程",
    tutorialNote: "边玩边学 · 约 5 分钟",
    continue: "继续上局",
    rulesNote: "三分钟看懂怎么玩",
    report: "行动报告",
    rulesTitle: "纸上防疫 · 规则手册",
    close: "关闭",
    hint: "点角色弹出行动 · 点城市看详情 · 拖动平移 · 双击回到当前角色",
    language: "语言",
  },
  ja: {
    gameName: "紙上防疫",
    stageLabel: "紙の地図の上の防疫作戦",
    ap: "行動ポイント",
    outbreaks: "アウトブレイク",
    cures: "治療薬",
    lastInfected: "前回の感染",
    rules: "ルール",
    menu: "メニュー",
    chooseAction: "行動を選ぶ",
    undo: "戻す",
    endTurn: "行動終了",
    fast: "早送り",
    cancel: "やめる",
    epidemicBang: "エピデミック！",
    draftTitle: "隊員を 2 人選ぶ",
    draftLead: "8 人の隊員から 2 人を選んで出発します。",
    back: "戻る",
    draftGo: "出発する",
    startGame: "ゲーム開始",
    startGameNote: "新しいゲーム · 約 15 分",
    tutorial: "チュートリアル",
    tutorialNote: "遊びながら覚える · 約 5 分",
    continue: "つづきから",
    rulesNote: "3 分でわかる遊び方",
    report: "作戦報告",
    rulesTitle: "紙上防疫 · ルールブック",
    close: "閉じる",
    hint: "隊員をタップで行動 · 都市をタップで詳細 · ドラッグで移動 · ダブルクリックで隊員に戻る",
    language: "言語",
  },
  en: {
    gameName: "Paper Quarantine",
    stageLabel: "Containment effort on a paper map",
    ap: "Actions",
    outbreaks: "Outbreaks",
    cures: "Cures",
    lastInfected: "Last infected",
    rules: "How to play",
    menu: "Menu",
    chooseAction: "Choose an action",
    undo: "Undo",
    endTurn: "End turn",
    fast: "Skip",
    cancel: "Cancel",
    epidemicBang: "Epidemic!",
    draftTitle: "Pick two agents",
    draftLead: "Choose 2 of the 8 agents for this mission.",
    back: "Back",
    draftGo: "Deploy",
    startGame: "New game",
    startGameNote: "A fresh run · 15 min",
    tutorial: "Tutorial",
    tutorialNote: "Learn by playing · 5 min",
    continue: "Continue",
    rulesNote: "The rules in three minutes",
    report: "Mission report",
    rulesTitle: "Paper Quarantine · Rulebook",
    close: "Close",
    hint: "Tap an agent to act · tap a city for details · drag to pan · double-click to recentre",
    language: "Language",
  },
});

export function applyStaticText(): void {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((n) => {
    n.textContent = STATIC[n.dataset.i18n!] ?? n.textContent;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((n) => {
    n.setAttribute("aria-label", STATIC[n.dataset.i18nAria!] ?? "");
  });
  document.querySelectorAll<HTMLElement>("[data-lang-switch]").forEach((box) => {
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", STATIC.language);
    box.innerHTML = LOCALES.map((l) => `<button type="button" data-locale="${l}" aria-pressed="${l === LOCALE}">${LOCALE_LABELS[l]}</button>`).join("");
    box.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-locale]");
      const next = b?.dataset.locale as Locale | undefined;
      if (!next || next === LOCALE) return;
      saveLocale(next);
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      location.replace(url.toString());
    });
  });
}
