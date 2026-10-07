import "@fontsource/zcool-xiaowei";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./styles.css";
import { App } from "./app";
import { loadAssets } from "./art/assets";

async function boot(): Promise<void> {
  const assets = await loadAssets();
  const app = new App(assets);
  if (import.meta.env.DEV) {
    const { installDebug } = await import("./debug");
    installDebug(app);
  }
}

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML("beforeend", `<p class="boot-error">加载失败：${String(err?.message ?? err)}</p>`);
});
