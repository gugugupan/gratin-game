import type { RoleId } from "../../../engine/game.js";
import { CITY_NAMES, GAME_NAME, REGION_NAMES, ROLE_ORDER } from "../data";
import { FONT, loadFonts } from "../i18n/locale";
import { cutoutFromImage, type PaperArt } from "./paper";

export const TOKEN_KEYS = ["station", "field_lab", "lockdown", "virus_red", "virus_blue", "virus_gold", "outbreak", "named_pin"] as const;
const ICON_KEYS = [
  "cure_red", "cure_blue", "cure_gold", "sample_red", "sample_blue", "sample_gold", "epidemic",
  "mut_breach", "mut_resistant", "mut_virulent", "mut_stubborn", "mut_acute",
] as const;
export const ASSET_COUNT = ROLE_ORDER.length + TOKEN_KEYS.length + ICON_KEYS.length;
export type TokenKey = (typeof TOKEN_KEYS)[number];

export interface Assets {
  roleImages: Record<RoleId, HTMLImageElement>;
  roleArt: Record<RoleId, PaperArt>;
  tokenArt: Record<TokenKey, PaperArt>;
}

const base = import.meta.env.BASE_URL;

export const iconUrl = (name: string) => `${base}art/icons/${name}.webp`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export async function loadAssets(onLoaded: () => void = () => {}): Promise<Assets> {
  const load = (src: string) => loadImage(src).then((img) => {
    onLoaded();
    return img;
  });
  const [roleList, tokenList] = await Promise.all([
    Promise.all(ROLE_ORDER.map((k) => load(`${base}art/${k}.webp`))),
    Promise.all(TOKEN_KEYS.map((k) => load(`${base}art/tokens/${k}.webp`))),
    Promise.all(ICON_KEYS.map((k) => load(iconUrl(k)))),
  ]);
  const roleImages = {} as Record<RoleId, HTMLImageElement>;
  const roleArt = {} as Record<RoleId, PaperArt>;
  ROLE_ORDER.forEach((k, i) => {
    roleImages[k] = roleList[i];
    roleArt[k] = cutoutFromImage(roleList[i], 512, 26, 13);
  });
  const tokenArt = {} as Record<TokenKey, PaperArt>;
  TOKEN_KEYS.forEach((k, i) => { tokenArt[k] = cutoutFromImage(tokenList[i], 384, 14, 9); });
  return { roleImages, roleArt, tokenArt };
}

let resolveFonts: () => void = () => {};
export const fontsReady: Promise<void> = new Promise((res) => { resolveFonts = res; });

export async function waitFonts(): Promise<void> {
  const sample = [...CITY_NAMES, ...REGION_NAMES, GAME_NAME].join("");
  await Promise.race([
    loadFonts().then(() => Promise.all([
      document.fonts.load(`40px ${FONT.display}`, sample),
      document.fonts.load('20px "Courier Prime"'),
      document.fonts.load(`15px ${FONT.body}`, sample),
    ])),
    new Promise((res) => setTimeout(res, 4000)),
  ]);
  resolveFonts();
}
