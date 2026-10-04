// engine.js 的类型声明（数据结构见 document/LEVEL_SCHEMA.md）

export type Tag = string;

export interface CellDisplay { bg?: string; label?: string; sprite?: string | null; }

export interface Cell {
  id: number;
  x: number;
  y: number;
  tags: Tag[];
  assignable: boolean;
  fixedRegion: string | null;
  display?: CellDisplay;
}

export interface Board { width: number; height: number; cells: Cell[]; }

export type LocalizedString = string | Record<string, string>;

export interface Owner { name: LocalizedString; color: string; icon?: string; avatar?: string | null; }

export type ConstraintType =
  | 'AREA_EQ' | 'AREA_GE' | 'AREA_LE' | 'AREA_MAX' | 'AREA_MIN'
  | 'MUST_CONTAIN_CELL' | 'MUST_NOT_CONTAIN_CELL'
  | 'MUST_CONTAIN_TAG' | 'MUST_NOT_CONTAIN_TAG'
  | 'TAG_COUNT_EQ' | 'TAG_COUNT_GE' | 'TAG_COUNT_LE'
  | 'MUST_TOUCH_TAG' | 'MUST_NOT_TOUCH_TAG'
  | 'MUST_TOUCH_REGION' | 'MUST_NOT_TOUCH_REGION'
  | 'MUST_ON_EDGE' | 'MUST_NOT_ON_CORNER'
  | 'AREA_LARGER_THAN' | 'AREA_EQUAL_TO' | 'DIRECTION_OF'
  | 'ONLY_ONE_CONTAINS' | 'ONLY_ONE_TOUCHES'
  | 'SUPPLIED_BY' | 'EXCLUSIVE_TO' | 'NO_TAG_WITHIN'
  | 'WITHIN_REGION' | 'FAR_FROM_REGION' | 'SHAPE_LINE' | 'SHAPE_SQUARE';

export interface Constraint {
  type: ConstraintType;
  params?: Record<string, any>;
}

export type Facility = 'gather' | 'factory';

export interface RegionDef { id: string; owner: Owner; constraints: Constraint[]; facility?: Facility; }

export interface Product { name: LocalizedString; icon: string; goal: string; }

export interface Level {
  schemaVersion: number;
  id: string;
  name: LocalizedString;
  chapter?: number;
  difficulty?: number;
  theme?: string;
  story?: LocalizedString;
  product?: Product;
  basics?: boolean;
  shapeRule: 'RECT' | 'ANY' | 'SQUARE' | 'L';
  adjacency?: 4 | 8;
  coverage: 'FULL' | 'PARTIAL';
  board: Board;
  regions: RegionDef[];
  globalConstraints?: Constraint[];
  solution?: Array<{ region: string; cells: number[] }>;
  meta?: Record<string, any>;
}

export interface ConstraintResult {
  scope: 'region' | 'global';
  regionId: string | null;
  type: ConstraintType;
  params?: Record<string, any>;
  satisfied: boolean;
}

export interface HardResult { type: 'RECT'; regionId: string; ok: boolean; }

export interface ValidateResult {
  ok: boolean;
  complete: boolean;
  constraints: ConstraintResult[];
  hard: HardResult[];
}

export type RegionsMap = Map<string, number[]>;

export function buildIndex(level: Level): any;
export function isFilledRect(ix: any, cells: Cell[]): boolean;
export function validate(level: Level, regionsMap: RegionsMap): ValidateResult;
export function solve(level: Level, opts?: { maxSolutions?: number }): Array<Array<{ region: string; cells: number[] }>>;
export function isUniqueSolution(level: Level): boolean;
