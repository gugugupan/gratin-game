import "@fontsource/zcool-xiaowei";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./styles.css";
import { App } from "./app";
import { ASSET_COUNT, fontsReady, loadAssets } from "./art/assets";
import { Loading, nextFrame } from "./loading";

const FONT_WEIGHT = 3;
const SCENE_WEIGHT = 8;
const loading = new Loading(FONT_WEIGHT + ASSET_COUNT + SCENE_WEIGHT);

async function boot(): Promise<void> {
  loading.say("正在准备纸张……");
  const fonts = loading.track(fontsReady, FONT_WEIGHT);
  const assets = await loadAssets(() => loading.advance());
  loading.say("正在裁剪纸片……");
  await fonts;
  loading.say("正在铺开地图……");
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
  loading.fail(`加载失败：${String(err?.message ?? err)}`);
});
