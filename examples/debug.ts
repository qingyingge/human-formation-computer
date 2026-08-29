import { NodeDef, CircuitDef, HumanComputerEngine } from '../src';

function createALU8(): CircuitDef {
  const nodes: NodeDef[] = [];

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `a[${i}]`, gate: 'INPUT', inputs: [] });
    nodes.push({ id: `b[${i}]`, gate: 'INPUT', inputs: [] });
  }
  nodes.push({ id: 'op[0]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[1]', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'op[2]', gate: 'INPUT', inputs: [] });

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `b_xor_op2[${i}]`, gate: 'XOR', inputs: [`b[${i}]`, 'op[2]'] });
  }
  
  for (let i = 0; i < 8; i++) {
    const cin = i === 0 ? 'op[2]' : `carry[${i - 1}]`;
    nodes.push({ id: `add_xor1[${i}]`, gate: 'XOR', inputs: [`a[${i}]`, `b_xor_op2[${i}]`] });
    nodes.push({ id: `add_sum[${i}]`, gate: 'XOR', inputs: [`add_xor1[${i}]`, cin] });
    nodes.push({ id: `add_and1[${i}]`, gate: 'AND', inputs: [`a[${i}]`, `b_xor_op2[${i}]`] });
    nodes.push({ id: `add_and2[${i}]`, gate: 'AND', inputs: [cin, `add_xor1[${i}]`] });
    nodes.push({ id: `carry[${i}]`, gate: 'OR', inputs: [`add_and1[${i}]`, `add_and2[${i}]`] });
  }

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `band[${i}]`, gate: 'AND', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bor[${i}]`, gate: 'OR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bxor[${i}]`, gate: 'XOR', inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bnot[${i}]`, gate: 'NOT', inputs: [`a[${i}]`] });
  }

  nodes.push({ id: 'not_op2', gate: 'NOT', inputs: ['op[2]'] });
  nodes.push({ id: 'not_op1', gate: 'NOT', inputs: ['op[1]'] });
  nodes.push({ id: 'not_op0', gate: 'NOT', inputs: ['op[0]'] });
  
  nodes.push({ id: 'sel_addsub', gate: 'AND', inputs: ['not_op2', 'not_op1'] });
  nodes.push({ id: 'sel_and', gate: 'AND', inputs: ['not_op2', 'op[1]', 'not_op0'] });
  nodes.push({ id: 'sel_or', gate: 'AND', inputs: ['not_op2', 'op[1]', 'op[0]'] });
  nodes.push({ id: 'sel_xor', gate: 'AND', inputs: ['op[2]', 'not_op1', 'not_op0'] });
  nodes.push({ id: 'sel_not', gate: 'AND', inputs: ['op[2]', 'not_op1', 'op[0]'] });

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
    value |= (engine.getNodeState(`${prefix}[${i}]`) << i);
  }
  return value;
}

function setOP(engine: HumanComputerEngine, op: number): void {
  engine.setInput('op[0]', (op & 1) as 0 | 1);
  engine.setInput('op[1]', ((op >> 1) & 1) as 0 | 1);
  engine.setInput('op[2]', ((op >> 2) & 1) as 0 | 1);
}

// 调试单个测试
function debugTest() {
  const circuit = createALU8();
  const engine = new HumanComputerEngine(circuit);
  
  console.log('--- 测试 ADD: 3 + 5 ---');
  setByte(engine, 'a', 3);
  setByte(engine, 'b', 5);
  setOP(engine, 0);
  
  console.log('\n计算前:');
  console.log('a:', getByte(engine, 'a'));
  console.log('b:', getByte(engine, 'b'));
  console.log('op:', engine.getNodeState('op[0]'), engine.getNodeState('op[1]'), engine.getNodeState('op[2]'));
  
  const result = engine.compute();
  
  console.log('\n计算后:');
  console.log('sel_addsub:', engine.getNodeState('sel_addsub'));
  console.log('sel_and:', engine.getNodeState('sel_and'));
  console.log('sel_or:', engine.getNodeState('sel_or'));
  console.log('sel_xor:', engine.getNodeState('sel_xor'));
  console.log('sel_not:', engine.getNodeState('sel_not'));
  
  console.log('\n加法器中间结果:');
  for (let i = 0; i < 8; i++) {
    console.log(`  b_xor_op2[${i}]:`, engine.getNodeState(`b_xor_op2[${i}]`),
                `add_xor1[${i}]:`, engine.getNodeState(`add_xor1[${i}]`),
                `add_sum[${i}]:`, engine.getNodeState(`add_sum[${i}]`),
                `carry[${i}]:`, engine.getNodeState(`carry[${i}]`));
  }
  
  console.log('\n最终结果:');
  console.log('out:', getByte(engine, 'out'));
  console.log('carry_out:', engine.getNodeState('carry_out'));
}

debugTest();
