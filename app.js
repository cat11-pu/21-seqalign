// app.js：场景驱动与视图（给定骨架，答题时不用改）
import { load, appendChar, align } from "./ops.js";

function copyState(state) {
  const grid = state.grid || { M: [[0]], X: [[-1000]], Y: [[-1000]] };
  return {
    a: state.a || "",
    b: state.b || "",
    grid: {
      M: (grid.M || [[0]]).map(function (row) { return row.slice(); }),
      X: (grid.X || [[-1000]]).map(function (row) { return row.slice(); }),
      Y: (grid.Y || [[-1000]]).map(function (row) { return row.slice(); })
    },
    filled: (state.filled || [0, 0]).slice(),
    columns: (state.columns || []).map(function (pair) { return pair.slice(); }),
    cigar: state.cigar || "",
    score: state.score || 0,
    best: (state.best || [0, 0, "M"]).slice(),
    matches: state.matches || 0,
    mismatches: state.mismatches || 0,
    gaps: state.gaps || 0,
    gap_runs: state.gap_runs || 0,
    permille: state.permille || 0,
    aligns: state.aligns || 0,
    loads: state.loads || 0,
    appends: state.appends || 0,
    cells: state.cells || 0,
    last_cells: state.last_cells || 0
  };
}

export function render(spec) {
  let state = copyState(spec.state);
  const failed = [];
  for (const event of spec.events || []) {
    try {
      if (event.kind === "load") {
        state = load(state, event.a, event.b);
      } else if (event.kind === "append") {
        state = appendChar(state, event.side, event.ch);
      } else if (event.kind === "align") {
        state = align(state);
      } else {
        throw Object.assign(new Error("E_BAD_EVENT"), { code: "E_BAD_EVENT" });
      }
    } catch (error) {
      failed.push([event.kind, error && error.code ? error.code : "E_BAD_EVENT"]);
    }
  }
  const kinds = state.columns.map(function (pair) {
    if (pair[0] !== "-" && pair[1] !== "-") {
      return pair[0] === pair[1] ? "=" : "X";
    }
    return pair[0] === "-" ? "I" : "D";
  });
  return {
    a: state.a,
    b: state.b,
    columns: state.columns,
    kinds: kinds,
    a_row: state.columns.map(function (pair) { return pair[0]; }).join(""),
    b_row: state.columns.map(function (pair) { return pair[1]; }).join(""),
    cigar: state.cigar,
    score: state.score,
    best: state.best,
    matches: state.matches,
    mismatches: state.mismatches,
    gaps: state.gaps,
    gap_runs: state.gap_runs,
    permille: state.permille,
    aligns: state.aligns,
    loads: state.loads,
    appends: state.appends,
    cells: state.cells,
    last_cells: state.last_cells,
    failed: failed.length,
    failed_marks: failed
  };
}
