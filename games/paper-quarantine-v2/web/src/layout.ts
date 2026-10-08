const SPREAD = 1.12;

const LAYOUT: [number, number][] = [
  [0, 0], [-7, 5], [-6, -5], [-14, -6], [-12, 1], [-16, 8],
  [5, 6], [13, 12], [2, 13], [10, 5], [-5, 12], [17, 6],
  [6, -5], [12, -2], [2, -12], [9, -10], [17, -8], [-6, -13],
];

export const POS2D: [number, number][] = LAYOUT.map(([x, y]) => [x * SPREAD, y * SPREAD]);
