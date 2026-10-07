import { State, type SaveData } from "../../../engine/game.js";

const KEY = "paper-quarantine:save:v1";

export function saveGame(state: State): void {
  if (state.status !== "playing" || state.inInfection) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state.serialize()));
  } catch {
    // Storage can be unavailable (private mode, quota); the game keeps running without a save.
  }
}

export function loadGame(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state = State.restore(JSON.parse(raw) as SaveData);
    return state.status === "playing" ? state : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
