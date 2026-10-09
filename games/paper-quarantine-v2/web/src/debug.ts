import type { App } from "./app";
import { cityWorld } from "./art/mapArt";

export function installDebug(app: App): void {
  const cityScreen = (city: number) => {
    const v = cityWorld(city).project(app.stage.camera);
    return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight];
  };
  Object.assign(window, { app, cityScreen });
}
