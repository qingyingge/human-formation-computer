import { NodeDef, CircuitDef, HumanComputerEngine } from '../src';

/**
 * 8位ALU（算术逻辑单元）
 * 
 * 操作码 OP[2:0]:
 * - 000: ADD (A + B)
 * - 001: SUB (A - B)
 * - 010: AND (A & B)
 * - 011: OR  (A | B)
 * - 100: XOR (A ^ B)
 * - 101: NOT (~A)
 */

function createALU8(): CircuitDef {
  const nodes: NodeDef[] = [];

  // 输入节点
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `a[${i}]`, gate: 'INPUT', inputs: [] });
    nodes.push({ id: `b[${i}]`, gate: 'INPUT', inputs: [] });
  }
  nodes.push({ id: 'op[0]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[1]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[2]', gate: 'INPUT', inputs: [] });

  // === 1. 操作码解码 ===
  // is_sub = op[2]=0 AND op[1]=0 AND op[0]=1 (即SUB操作)
  nodes.push({ id: 'not_op2', gate: 'NOT', inputs: ['op[2]'] });
  nodes.push({ id: 'not_op1', gate: 'NOT', inputs: ['op[1]'] });
  nodes.push({ id: 'not_op0', gate: 'NOT', inputs: ['op[0]'] });
  
  // is_arith = NOT(op[2]) (算术运算：ADD/SUB)
  nodes.push({ id: 'is_arith', gate: 'AND', inputs: ['not_op2'] });
  // is_sub = is_arith AND NOT(op[1]) AND op[0] (SUB)
  nodes.push({ id: 'is_sub', gate: 'AND', inputs: ['is_arith', 'not_op1', 'op[0]'] });
  
  // 选择信号
  nodes.push({ id: 'sel_addsub', gate: 'AND', inputs: ['not_op2', 'not_op1'] });  // 00x
  nodes.push({ id: 'sel_and', gate: 'AND', inputs: ['not_op2', 'op[1]', 'not_op0'] });  // 010
  nodes.push({ id: 'sel_or', gate: 'AND', inputs: ['not_op2', 'op[1]', 'op[0]'] });  // 011
  nodes.push({ id: 'sel_xor', gate: 'AND', inputs: ['op[2]', 'not_op1', 'not_op0'] });  // 100
  nodes.push({ id: 'sel_not', gate: 'AND', inputs: ['op[2]', 'not_op1', 'op[0]'] });  // 101

  // === 2. 加法器（也用于减法）===
  // 减法时：B XOR is_sub (如果is_sub=1则取反)，进位输入是is_sub
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

  // === 3. 按位逻辑运算 ===
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `band[${i}]`, gate: 'AND', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bor[${i}]`, gate: 'OR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bxor[${i}]`, gate: 'XOR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bnot[${i}]`, gate: 'NOT', inputs: [`a[${i}]`] });
  }

  // === 4. 多路选择器 ===
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

  // 进位输出
  nodes.push({ id: 'carry_out', gate: 'BUF', inputs: ['carry[7]'] });

  return { nodes };
}

function setByte(engine: HumanComputerEngine, prefix: string, value: number): void {
  for (let i = 0; i < 8; i++) {
    engine.setInput(`${prefix}[${i}]`, ((value >> i) & 1) as 0 | 1);
  }
}

function getByte(engine: HumanComputerEngine, prefix: string): number {
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value |= (engine.query(`${prefix}[${i}]`) << i);
  }
  return value;
}

function setOP(engine: HumanComputerEngine, op: number): void {
  engine.setInput('op[0]', (op & 1) as 0 | 1);
  engine.setInput('op[1]', ((op >> 1) & 1) as 0 | 1);
  engine.setInput('op[2]', ((op >> 2) & 1) as 0 | 1);
}

function testALU8() {
  console.log('=== 8位ALU测试 ===\n');
  
  const circuit = createALU8();
  const engine = new HumanComputerEngine(circuit, { propagationDelayMs: 100 });
  
  console.log('电路统计:', engine.getStats());
  console.log('传播延迟:', engine.getLayers().length * 100, 'ms');
  
  const tests = [
    // ADD (op=0)
    { name: 'ADD', op: 0, a: 3, b: 5, expected: 8 },
    { name: 'ADD', op: 0, a: 100, b: 55, expected: 155 },
    { name: 'ADD', op: 0, a: 255, b: 1, expected: 0 },
    // SUB (op=1)
    { name: 'SUB', op: 1, a: 10, b: 3, expected: 7 },
    { name: 'SUB', op: 1, a: 0, b: 1, expected: 255 },
    { name: 'SUB', op: 1, a: 5, b: 5, expected: 0 },
    // AND (op=2)
    { name: 'AND', op: 2, a: 0xFF, b: 0x0F, expected: 0x0F },
    { name: 'AND', op: 2, a: 0xAA, b: 0x55, expected: 0x00 },
    // OR (op=3)
    { name: 'OR',  op: 3, a: 0xF0, b: 0x0F, expected: 0xFF },
    { name: 'OR',  op: 3, a: 0xAA, b: 0x00, expected: 0xAA },
    // XOR (op=4)
    { name: 'XOR', op: 4, a: 0xFF, b: 0xFF, expected: 0x00 },
    { name: 'XOR', op: 4, a: 0xAA, b: 0x55, expected: 0xFF },
    // NOT (op=5)
    { name: 'NOT', op: 5, a: 0x00, b: 0, expected: 0xFF },
    { name: 'NOT', op: 5, a: 0xFF, b: 0, expected: 0x00 },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    engine.reset();
    setByte(engine, 'a', test.a);
    setByte(engine, 'b', test.b);
    setOP(engine, test.op);
    
    // 计算并生效所有变化
    engine.compute(0);
    engine.tick(10000);  // 等待所有传播完成
    
    const result = getByte(engine, 'out');
    const status = result === test.expected ? '✓' : '✗';
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }
    
    const opSymbols = ['+', '-', '&', '|', '^', '~'];
    console.log(`${status} ${test.name}: ${test.a} ${opSymbols[test.op]} ${test.b} = ${result} (expected ${test.expected})`);
  }
  
  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  console.log('\n=== 测试完成 ===');
}

testALU8();
