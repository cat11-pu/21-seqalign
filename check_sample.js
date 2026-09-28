import fs from "node:fs";
import { pairScore, gapCost, bestIndex } from "./scoring.js";
import { blankGrid, pendingCells, extendGrid, bestCell, traceback, columnStats, alignScore } from "./align.js";
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

const __lines = [];
function emit(label, value) {
  __lines.push([String(label).replace(/ =$/, ""), value]);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/pair.json", "utf8"));

function fingerprint(s) {
  return JSON.stringify({ a: s.a, b: s.b, grid: s.grid, filled: s.filled, columns: s.columns,
                          cigar: s.cigar, score: s.score, best: s.best, matches: s.matches,
                          mismatches: s.mismatches, gaps: s.gaps, gap_runs: s.gap_runs,
                          permille: s.permille, aligns: s.aligns, loads: s.loads,
                          appends: s.appends, cells: s.cells, last_cells: s.last_cells });
}

function drive(events) {
  let state = copyState(spec.state);
  let failed = 0;
  for (const event of events || []) {
    try {
      if (event.kind === "load") {
        state = load(state, event.a, event.b);
      } else if (event.kind === "append") {
        state = appendChar(state, event.side, event.ch);
      } else {
        state = align(state);
      }
    } catch (error) {
      failed += 1;
    }
  }
  return { state: state, failed: failed };
}

const events = spec.events || [];
const main = drive(events);
const state = main.state;
const whole = drive(events);
const half = Math.ceil(events.length / 2);
const left = drive(events.slice(0, half));
const right = (function () {
  let spot = copyState(left.state);
  for (const event of events.slice(half)) {
    try {
      spot = event.kind === "load" ? load(spot, event.a, event.b)
        : event.kind === "append" ? appendChar(spot, event.side, event.ch) : align(spot);
    } catch (error) { /* 跳过 */ }
  }
  return spot;
})();

// 验收台自己的打分复算（不借被测的 scoring.js）
function refScore(columns) {
  let total = 0;
  let run = 0;
  let side = "";
  const flush = function () {
    if (run > 0) { total -= 3 + run; }
    run = 0;
    side = "";
  };
  for (const column of columns) {
    if (column[0] !== "-" && column[1] !== "-") {
      flush();
      total += column[0] === column[1] ? 2 : -1;
    } else {
      const here = column[0] === "-" ? "I" : "D";
      if (side !== "" && side !== here) { flush(); }
      side = here;
      run += 1;
    }
  }
  flush();
  return total;
}

const aRow = state.columns.map(function (pair) { return pair[0]; }).join("");
const bRow = state.columns.map(function (pair) { return pair[1]; }).join("");
const stripGaps = function (text) { return text.split("-").join(""); };
const doubleGap = state.columns.some(function (pair) { return pair[0] === "-" && pair[1] === "-"; });

emit("序列", JSON.stringify([state.a, state.b]));
emit("末格", JSON.stringify([state.grid.M[state.a.length][state.b.length],
                                 state.grid.X[state.a.length][state.b.length],
                                 state.grid.Y[state.a.length][state.b.length]]));
emit("得分", state.score);
emit("最优格", JSON.stringify(state.best));
emit("a 行", aRow);
emit("b 行", bRow);
emit("列数", state.columns.length);
emit("CIGAR", state.cigar);
emit("匹配列", state.matches);
emit("错配列", state.mismatches);
emit("间隙列", state.gaps);
emit("间隙段", state.gap_runs);
emit("千分比", state.permille);
emit("比对次数", state.aligns);
emit("装载次数", state.loads);
emit("追加次数", state.appends);
emit("累计填格", state.cells);
emit("本次填格", state.last_cells);
emit("失败事件", main.failed);
emit("列复算一致", state.score === refScore(state.columns));
emit("两行字符对", stripGaps(aRow) === state.a && stripGaps(bRow) === state.b);
emit("无双间隙", !doubleGap);
emit("增量不重算", state.last_cells === 0);
emit("重放不新增", fingerprint(whole.state) === fingerprint(state) ? 0 : 1);
emit("重放报错", whole.failed);
emit("中态不同", fingerprint(left.state) !== fingerprint(state));
emit("拆两轮一致", fingerprint(right) === fingerprint(whole.state));

// ---- 异常路径探针：真调用实现，看它报出什么码 ----
try {
  load(copyState(spec.state), "", "ACGT");
  emit("空串报码", "没有报错");
} catch (error) {
  emit("空串报码", error && error.code ? error.code : String(error.message));
}
try {
  load(copyState(spec.state), "ACGN", "ACGT");
  emit("坏字母报码", "没有报错");
} catch (error) {
  emit("坏字母报码", error && error.code ? error.code : String(error.message));
}
try {
  load(copyState(spec.state), "ACGTACGTACGTACGTACGTACGTAA", "ACGT");
  emit("超长报码", "没有报错");
} catch (error) {
  emit("超长报码", error && error.code ? error.code : String(error.message));
}
try {
  align(copyState(spec.state));
  emit("未装载报码", "没有报错");
} catch (error) {
  emit("未装载报码", error && error.code ? error.code : String(error.message));
}
try {
  let fresh = load(copyState(spec.state), "ACGT", "ACGT");
  appendChar(fresh, "c", "A");
  emit("坏侧报码", "没有报错");
} catch (error) {
  emit("坏侧报码", error && error.code ? error.code : String(error.message));
}

// ---- 期望值（参考模型算出）----
const EXPECTED = {
  "序列": [
    "ACGTTACC",
    "ACGTACA"
  ],
  "末格": [
    7,
    1,
    0
  ],
  "得分": 7,
  "最优格": [
    8,
    7,
    "M"
  ],
  "a 行": "ACGTTACC",
  "b 行": "ACG-TACA",
  "列数": 8,
  "CIGAR": "3=1D3=1X",
  "匹配列": 6,
  "错配列": 1,
  "间隙列": 1,
  "间隙段": 1,
  "千分比": 750,
  "比对次数": 5,
  "装载次数": 1,
  "追加次数": 2,
  "累计填格": 71,
  "本次填格": 0,
  "失败事件": 1,
  "列复算一致": true,
  "两行字符对": true,
  "无双间隙": true,
  "增量不重算": true,
  "重放不新增": 0,
  "重放报错": 1,
  "中态不同": true,
  "拆两轮一致": true,
  "空串报码": "E_EMPTY",
  "坏字母报码": "E_BAD_CHAR",
  "超长报码": "E_TOO_LONG",
  "未装载报码": "E_NO_SEQ",
  "坏侧报码": "E_BAD_SIDE"
};
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  if (__same(found[1], want)) { console.log("一致 " + label + " = " + JSON.stringify(found[1])); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(found[1])); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
