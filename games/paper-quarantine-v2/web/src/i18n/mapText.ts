import type { MapText } from "../art/mapArt";
import { CITY_NAMES, GAME_NAME, REGION_NAMES } from "../data";
import { FONT, tr } from "./locale";

export const MAP_TEXT: MapText = {
  font: FONT.display,
  cities: CITY_NAMES,
  regions: REGION_NAMES,
  ...tr({
    zh: {
      cover: { title: GAME_NAME, subtitle: "PAPER  QUARANTINE", issue: "纸乡防疫图 · 第 07 号", tagline: "一人两角 · 十二轮内研制三种解药" },
    },
    ja: {
      cover: { title: GAME_NAME, subtitle: "PAPER  QUARANTINE", issue: "紙の郷 防疫図 · 第 07 号", tagline: "ひとりで 2 人 · 12 ラウンドで治療薬を 3 つ" },
    },
    en: {
      cover: { title: GAME_NAME, subtitle: "紙 · 纸 · PAPER", issue: "Papermark sheet No. 07", tagline: "Two agents · three cures · twelve rounds" },
    },
  }),
};
