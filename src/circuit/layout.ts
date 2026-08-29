/**
 * ALU8 电路节点 → 士兵位置映射
 *
 * 16x19 网格，182 个节点按功能分区：
 *   row 0-1   INPUT 区（19 个输入，最前排可见）
 *   row 2     DECODE 区（操作码解码）
 *   row 3-8   ADDER 区（6 行 x 8 列）
 *   row 9-12  LOGIC 区（4 行 x 8 列）
 *   row 13-17 MUX AND 区（5 行 x 8 列，每行一种 mux_and 门）
 *   row 18-21 MUX OR 区（4 行 x 8 列，每行一种 mux_or 门 + out）
 *   row 22    carry_out
 */

export interface SoldierPosition {
  idx: number;
  nodeId: string;
  gridX: number;
  gridZ: number;
  group: string;
}

function pos(idx: number, nodeId: string, gridX: number, gridZ: number, group: string): SoldierPosition {
  return { idx, nodeId, gridX, gridZ, group };
}

export function buildALU8Layout(): SoldierPosition[] {
  const layout: SoldierPosition[] = [];
  let idx = 0;

  // === ROW 0: a[0..7] ===
  for (let i = 0; i < 8; i++) {
    layout.push(pos(idx++, `a[${i}]`, i, 0, 'INPUT'));
  }

  // === ROW 1: b[0..7], op[0..2] ===
  for (let i = 0; i < 8; i++) {
    layout.push(pos(idx++, `b[${i}]`, i, 1, 'INPUT'));
  }
  for (let i = 0; i < 3; i++) {
    layout.push(pos(idx++, `op[${i}]`, 8 + i, 1, 'INPUT'));
  }

  // === ROW 2: DECODE ===
  const decodeNodes = [
    'not_op2', 'not_op1', 'not_op0',
    'is_arith', 'is_sub',
    'sel_addsub', 'sel_and', 'sel_or', 'sel_xor', 'sel_not',
  ];
  for (let i = 0; i < decodeNodes.length; i++) {
    layout.push(pos(idx++, decodeNodes[i], i, 2, 'DECODE'));
  }

  // === ROWS 3-8: ADDER (6 rows, 8 columns) ===
  const adderRows = [
    'b_xor_sub', 'add_xor1', 'add_sum', 'add_and1', 'add_and2', 'carry',
  ];
  for (let row = 0; row < adderRows.length; row++) {
    for (let bit = 0; bit < 8; bit++) {
      layout.push(pos(idx++, `${adderRows[row]}[${bit}]`, bit, 3 + row, 'ADDER'));
    }
  }

  // === ROWS 9-12: LOGIC (4 rows, 8 columns) ===
  const logicRows = ['band', 'bor', 'bxor', 'bnot'];
  for (let row = 0; row < logicRows.length; row++) {
    for (let bit = 0; bit < 8; bit++) {
      layout.push(pos(idx++, `${logicRows[row]}[${bit}]`, bit, 9 + row, 'LOGIC'));
    }
  }

  // === ROWS 13-17: MUX AND stage (5 rows, 1 row per mux_and type) ===
  const muxAndNodes = ['mux_and1', 'mux_and2', 'mux_and3', 'mux_and4', 'mux_and5'];
  for (let row = 0; row < muxAndNodes.length; row++) {
    for (let bit = 0; bit < 8; bit++) {
      layout.push(pos(idx++, `${muxAndNodes[row]}[${bit}]`, bit, 13 + row, 'MUX'));
    }
  }

  // === ROWS 18-21: MUX OR stage (4 rows, 1 row per mux_or type) ===
  const muxOrNodes = ['mux_or12', 'mux_or34', 'mux_or1234', 'out'];
  for (let row = 0; row < muxOrNodes.length; row++) {
    for (let bit = 0; bit < 8; bit++) {
      layout.push(pos(idx++, `${muxOrNodes[row]}[${bit}]`, bit, 18 + row, 'MUX'));
    }
  }

  // === ROW 22: carry_out ===
  layout.push(pos(idx++, 'carry_out', 0, 22, 'OUTPUT'));

  return layout;
}
