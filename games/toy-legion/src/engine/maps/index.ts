import type { MapDef } from '../types';
import { BLOCK_TOWN } from './block-town';
import { CASTLE_FIELD } from './castle-field';
import { RIVER_BANKS } from './river-banks';

export interface MapInfo {
  map: MapDef;
  name: string;
  blurb: string;
  stars: number;
}

export const MAPS: MapInfo[] = [
  { map: CASTLE_FIELD, name: '城堡草原', blurb: '官方入门地图的结构，路线多、区域大。', stars: 2 },
  { map: RIVER_BANKS, name: '小河两岸', blurb: '只有两座桥和一个小岛能过河，适合防守。', stars: 3 },
  { map: BLOCK_TOWN, name: '积木城镇', blurb: '方格街区，区域小、奖牌多，节奏快。', stars: 1 },
];

export const mapById = (id: string) => MAPS.find(m => m.map.id === id) ?? MAPS[0];
