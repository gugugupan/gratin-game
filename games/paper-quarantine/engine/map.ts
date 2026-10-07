export const STRAINS = 3;
export const STRAIN_NAMES = ["赤株", "苍株", "金株"] as const;

export interface City {
  id: number;
  name: string;
  strain: number;
}

export const CITIES: City[] = [
  "枢港", "赤岩", "丹霞", "朱桥", "绛城", "赭原",
  "苍门", "碧湾", "蓝屿", "靛川", "沧涯", "青坞",
  "金沙", "琥原", "橙林", "鎏城", "黄岭", "杏湾",
].map((name, id) => ({ id, name, strain: Math.floor(id / 6) }));

export const CITY_COUNT = CITIES.length;
export const HUB = 0;

const REGION_EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 5],
];

export const EDGES: [number, number][] = [
  ...[0, 6, 12].flatMap((o) => REGION_EDGES.map(([a, b]): [number, number] => [a + o, b + o])),
  [0, 6], [6, 12], [12, 0],
  [5, 11], [11, 17], [17, 5],
];

export interface Link {
  to: number;
  edge: number;
}

export const LINKS: Link[][] = CITIES.map(() => []);
EDGES.forEach(([a, b], edge) => {
  LINKS[a].push({ to: b, edge });
  LINKS[b].push({ to: a, edge });
});

export const DIST: number[][] = CITIES.map((_, from) => {
  const dist = new Array<number>(CITY_COUNT).fill(Infinity);
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const c = queue.shift()!;
    for (const { to } of LINKS[c]) {
      if (dist[to] === Infinity) {
        dist[to] = dist[c] + 1;
        queue.push(to);
      }
    }
  }
  return dist;
});
