import type { NodeDef, CircuitDef } from '../engine/types';

/**
 * 8位ALU电路定义
 *
 * 操作码 OP[2:0]:
 * - 000: ADD (A + B)
 * - 001: SUB (A - B)
 * - 010: AND (A & B)
 * - 011: OR  (A | B)
 * - 100: XOR (A ^ B)
 * - 101: NOT (~A)
 *
 * 共 182 个节点
 */
export function createALU8(): CircuitDef {
  const nodes: NodeDef[] = [];

  // === INPUT (19) ===
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `a[${i}]`, gate: 'INPUT', inputs: [] });
    nodes.push({ id: `b[${i}]`, gate: 'INPUT', inputs: [] });
  }
  nodes.push({ id: 'op[0]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[1]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[2]', gate: 'INPUT', inputs: [] });

  // === DECODE (10) ===
  nodes.push({ id: 'not_op2', gate: 'NOT', inputs: ['op[2]'] });
  nodes.push({ id: 'not_op1', gate: 'NOT', inputs: ['op[1]'] });
  nodes.push({ id: 'not_op0', gate: 'NOT', inputs: ['op[0]'] });
  nodes.push({ id: 'is_arith', gate: 'AND', inputs: ['not_op2'] });
  nodes.push({ id: 'is_sub', gate: 'AND', inputs: ['is_arith', 'not_op1', 'op[0]'] });
  nodes.push({ id: 'sel_addsub', gate: 'AND', inputs: ['not_op2', 'not_op1'] });
  nodes.push({ id: 'sel_and', gate: 'AND', inputs: ['not_op2', 'op[1]', 'not_op0'] });
  nodes.push({ id: 'sel_or', gate: 'AND', inputs: ['not_op2', 'op[1]', 'op[0]'] });
  nodes.push({ id: 'sel_xor', gate: 'AND', inputs: ['op[2]', 'not_op1', 'not_op0'] });
  nodes.push({ id: 'sel_not', gate: 'AND', inputs: ['op[2]', 'not_op1', 'op[0]'] });

  // === ADDER (48) ===
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `b_xor_sub[${i}]`, gate: 'XOR', inputs: [`b[${i}]`, 'is_sub'] });
  }
  for (let i = 0; i < 8; i++) {
    const cin = i === 0 ? 'is_sub' : `carry[${i - 1}]`;
    nodes.push({ id: `add_xor1[${i}]`, gate: 'XOR', inputs: [`a[${i}]`, `b_xor_sub[${i}]`] });
    nodes.push({ id: `add_sum[${i}]`, gate: 'XOR', inputs: [`add_xor1[${i}]`, cin] });
    nodes.push({ id: `add_and1[${i}]`, gate: 'AND', inputs: [`a[${i}]`, `b_xor_sub[${i}]`] });
    nodes.push({ id: `add_and2[${i}]`, gate: 'AND', inputs: [cin, `add_xor1[${i}]`] });
    nodes.push({ id: `carry[${i}]`, gate: 'OR', inputs: [`add_and1[${i}]`, `add_and2[${i}]`] });
  }

  // === BITWISE LOGIC (32) ===
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `band[${i}]`, gate: 'AND', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bor[${i}]`, gate: 'OR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bxor[${i}]`, gate: 'XOR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bnot[${i}]`, gate: 'NOT', inputs: [`a[${i}]`] });
  }

  // === OUTPUT MUX (72) ===
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `mux_and1[${i}]`, gate: 'AND', inputs: ['sel_addsub', `add_sum[${i}]`] });
    nodes.push({ id: `mux_and2[${i}]`, gate: 'AND', inputs: ['sel_and', `band[${i}]`] });
    nodes.push({ id: `mux_and3[${i}]`, gate: 'AND', inputs: ['sel_or', `bor[${i}]`] });
    nodes.push({ id: `mux_and4[${i}]`, gate: 'AND', inputs: ['sel_xor', `bxor[${i}]`] });
    nodes.push({ id: `mux_and5[${i}]`, gate: 'AND', inputs: ['sel_not', `bnot[${i}]`] });
    nodes.push({ id: `mux_or12[${i}]`, gate: 'OR', inputs: [`mux_and1[${i}]`, `mux_and2[${i}]`] });
    nodes.push({ id: `mux_or34[${i}]`, gate: 'OR', inputs: [`mux_and3[${i}]`, `mux_and4[${i}]`] });
    nodes.push({ id: `mux_or1234[${i}]`, gate: 'OR', inputs: [`mux_or12[${i}]`, `mux_or34[${i}]`] });
    nodes.push({ id: `out[${i}]`, gate: 'OR', inputs: [`mux_or1234[${i}]`, `mux_and5[${i}]`] });
  }

  // === CARRY OUT (1) ===
  nodes.push({ id: 'carry_out', gate: 'BUF', inputs: ['carry[7]'] });

  return { nodes };
}
