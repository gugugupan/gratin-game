export type Side = 'red' | 'blue';
export type TroopId = 'pip' | 'mira' | 'boing' | 'brix' | 'hop' | 'clank' | 'bruno' | 'rexie';
export type Effect = 'none' | 'draw2' | 'playAgain' | 'removeAdjacent' | 'ignoreConnection' | 'discardEnemy' | 'draw1';
export type NodeType = 'hq' | 'base' | 'crate' | 'garden';

export interface TroopDef {
  id: TroopId;
  strength: number | 'joker';
  effect: Effect;
}

export interface MapNode {
  id: string;
  pos: [number, number];
  type: NodeType;
  hqOf?: Side;
}

export interface Region {
  nodes: string[];
  medals: number;
}

export interface MapDef {
  id: string;
  width: number;
  height: number;
  nodes: Record<string, MapNode>;
  edges: [string, string][];
  regions: Region[];
  objective: number;
}

export interface Tile {
  uid: number;
  troop: TroopId;
  side: Side;
}

export type Pending =
  | { kind: 'playAgain' }
  | { kind: 'removeAdjacent'; options: string[] };

export type EndReason = 'hq' | 'objective' | 'stalled';

export interface GameState {
  map: MapDef;
  rng: number;
  turn: Side;
  stacks: Record<string, Tile[]>;
  reserve: Record<Side, Tile[]>;
  hand: Record<Side, Tile[]>;
  box: Tile[];
  discard: Tile[];
  medals: Record<Side, number>;
  claimed: boolean[];
  pending: Pending | null;
  winner: Side | 'draw' | null;
  skipped: Side | null;
  endReason: EndReason | null;
  moves: number;
}

export type Action =
  | { type: 'draw' }
  | { type: 'place'; tile: number; node: string }
  | { type: 'remove'; node: string }
  | { type: 'skip' };
