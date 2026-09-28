// align.js：三张打分表与回溯（基线：空表原样返回，回溯给空）
export function blankGrid() {
  return { M: [[0]], X: [[0]], Y: [[0]] };
}

export function pendingCells(grid, a, b) {
  return 0;
}

export function extendGrid(grid, a, b) {
  return grid;
}

export function bestCell(grid, a, b) {
  return [0, 0, "M"];
}

export function traceback(grid, a, b) {
  return [];
}

export function columnStats(columns) {
  return { matches: 0, mismatches: 0, gaps: 0, gap_runs: 0, cigar: "", permille: 0 };
}

export function alignScore(columns) {
  return 0;
}
