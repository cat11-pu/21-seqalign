// ops.js：装载、追加、比对（基线：原样返回）
import { pairScore, gapCost, bestIndex } from "./scoring.js";
import { blankGrid, pendingCells, extendGrid, bestCell, traceback, columnStats, alignScore } from "./align.js";

export function load(state, a, b) {
  return state;
}

export function appendChar(state, side, ch) {
  return state;
}

export function align(state) {
  return state;
}
