import type { NewsId } from "../../engine/game.js";

export const NEWS_INFO: Record<NewsId, { name: string; text: string }> = {
  calm: { name: "无", text: "这一轮没有新闻，一切照常。" },
  festival: { name: "纸都花灯节", text: "2 轮内铁路运力翻倍，纸都每轮多派出 1 个携带者。" },
  fog: { name: "海雾", text: "本轮航线停运，航线上的携带者原地不动。" },
  rain: { name: "雨季", text: "2 轮内公路要走 2 轮。" },
  freighter: { name: "货轮靠港", text: "一座港口城市在本轮结束时迎来 2 个外来携带者。" },
  rumor: { name: "谣言", text: "一个疫区的所有城市恐慌 +15。" },
  peak: { name: "疫情高峰", text: "所有已感染、未封城的城市，各株感染 +1。" },
};
