import "./styles.css";
import { App } from "./app";
import { ASSET_COUNT, loadAssets, waitFonts } from "./art/assets";
import { GAME_NAME } from "./data";
import { tr } from "./i18n/locale";
import { applyStaticText } from "./i18n/static";
import { Loading, nextFrame } from "./loading";

const TEXT = tr({
  zh: { paper: "正在准备纸张……", cut: "正在裁剪纸片……", map: "正在铺开地图……", failed: "加载失败：" },
  ja: { paper: "紙を用意しています……", cut: "紙を切り抜いています……", map: "地図を広げています……", failed: "読み込みに失敗しました：" },
  en: { paper: "Fetching the paper…", cut: "Cutting out the pieces…", map: "Unfolding the map…", failed: "Failed to load: " },
});

const FONT_WEIGHT = 3;
const SCENE_WEIGHT = 8;
const loading = new Loading(FONT_WEIGHT + ASSET_COUNT + SCENE_WEIGHT);

async function boot(): Promise<void> {
  document.title = GAME_NAME;
  applyStaticText();
  loading.say(TEXT.paper);
  const fonts = loading.track(waitFonts(), FONT_WEIGHT);
  const assets = await loadAssets(() => loading.advance());
  loading.say(TEXT.cut);
  await fonts;
  loading.say(TEXT.map);
  await nextFrame();
  const app = new App(assets);
  await loading.track(app.ready, SCENE_WEIGHT);
  if (import.meta.env.DEV) {
    const { installDebug } = await import("./debug");
    installDebug(app);
  }
  loading.finish();
}

boot().catch((err) => {
  console.error(err);
  loading.fail(`${TEXT.failed}${String(err?.message ?? err)}`);
});
