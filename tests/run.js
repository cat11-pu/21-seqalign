import assert from "node:assert";
import { pairScore, gapCost, bestIndex } from "../scoring.js";
import { blankGrid, pendingCells, extendGrid, bestCell, traceback, columnStats, alignScore } from "../align.js";
import { load, appendChar, align } from "../ops.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("pairScore gives a number", () => {
  assert.strictEqual(typeof pairScore("A", "C"), "number");
});

check("gapCost gives a number", () => {
  assert.strictEqual(typeof gapCost(2), "number");
});

check("bestIndex gives a valid spot", () => {
  const at = bestIndex([1, 3, 2]);
  assert.ok(at === 0 || at === 1 || at === 2);
});

check("blankGrid has three tables", () => {
  const grid = blankGrid();
  assert.ok(Array.isArray(grid.M) && Array.isArray(grid.X) && Array.isArray(grid.Y));
});

check("extendGrid covers both sequences", () => {
  const grid = extendGrid(blankGrid(), "AC", "A");
  assert.strictEqual(grid.M.length, 3);
  assert.strictEqual(grid.M[0].length, 2);
});

check("pendingCells gives a number", () => {
  assert.strictEqual(typeof pendingCells(blankGrid(), "AC", "A"), "number");
});

check("bestCell gives a table name", () => {
  const grid = extendGrid(blankGrid(), "AC", "A");
  const spot = bestCell(grid, "AC", "A");
  assert.ok(["M", "X", "Y"].indexOf(spot[2]) >= 0);
});

check("traceback gives a list of columns", () => {
  const grid = extendGrid(blankGrid(), "AC", "A");
  const columns = traceback(grid, "AC", "A");
  assert.ok(Array.isArray(columns));
});

check("columnStats gives a cigar string", () => {
  assert.strictEqual(typeof columnStats([]).cigar, "string");
});

check("alignScore gives a number", () => {
  assert.strictEqual(typeof alignScore([]), "number");
});

check("load and align give a state", () => {
  const state = align(load({}, "AC", "A"));
  assert.strictEqual(typeof state.score, "number");
  assert.ok(Array.isArray(state.columns));
});

check("appendChar gives a state", () => {
  const state = appendChar(load({}, "AC", "A"), "a", "C");
  assert.strictEqual(typeof state.a, "string");
});

console.log("12 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
