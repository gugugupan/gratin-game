import type { MapDef } from '../types';
import { BLOCK_TOWN } from './block-town';
import { CASTLE_FIELD } from './castle-field';
import { RIVER_BANKS } from './river-banks';

export interface MapInfo {
  map: MapDef;
  stars: number;
}

export const MAPS: MapInfo[] = [
  { map: CASTLE_FIELD, stars: 2 },
  { map: RIVER_BANKS, stars: 3 },
  { map: BLOCK_TOWN, stars: 1 },
];

export const mapById = (id: string) => MAPS.find(m => m.map.id === id) ?? MAPS[0];
