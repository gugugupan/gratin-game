export const STRAINS = 3;
export const STRAIN_NAMES = ["赤株", "苍株", "金株"] as const;

export interface City {
  id: number;
  name: string;
  strain: number;
}

export const CITIES: City[] = [
  "纸都", "朱砂", "印泉", "胭脂湾", "红笺", "丹关",
  "砚城", "墨湾", "松烟", "靛染", "青螺", "雪浪",
  "箔城", "竹帘", "楮林", "浆池", "琥珀滩", "金粟",
].map((name, id) => ({ id, name, strain: Math.floor(id / 6) }));

export const CITY_COUNT = CITIES.length;
export const HUB = 0;

export const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 4], [2, 4], [4, 5], [2, 3], [3, 4],
  [6, 8], [6, 9], [8, 10], [9, 7], [7, 11], [9, 11], [8, 7],
  [12, 13], [12, 14], [14, 15], [13, 15], [15, 16], [13, 16], [14, 17],
  [0, 6], [0, 12], [1, 10], [2, 17], [9, 13],
  [5, 10], [3, 17], [11, 16],
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
