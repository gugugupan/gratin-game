import { HeuristicPolicy } from "../../sim/bots";
import type { App } from "./app";
import { cityWorld } from "./art/mapArt";

export function installDebug(app: App): void {
  const policy = new HeuristicPolicy({ beamWidth: 10 });
  addEventListener("keydown", (e) => {
    if (e.key !== "n" && e.key !== "N") return;
    const s = app.state;
    if (!s || s.status !== "playing") return;
    policy.playRound(s);
    void app.endTurn(true);
  });
  const cityScreen = (city: number) => {
    const v = cityWorld(city).project(app.stage.camera);
    return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight];
  };
  Object.assign(window, { app, cityScreen });
  if (new URLSearchParams(location.search).has("cover")) {
    app.newGame(["medic", "police"], 20261007);
    const s = app.state!;
    for (let i = 0; i < 2; i++) {
      policy.playRound(s);
      s.endRound(policy);
    }
    app.refresh(false);
    app.skipIntro();
    document.body.classList.add("cover-shot");
  }
}
