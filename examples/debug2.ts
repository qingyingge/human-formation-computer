import { HumanComputerEngine } from '../src';

function createALU8() {
  const nodes = [];

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `a[${i}]`, gate: 'INPUT' as const, inputs: [] });
    nodes.push({ id: `b[${i}]`, gate: 'INPUT' as const, inputs: [] });
  }
  nodes.push({ id: 'op[0]', gate: 'INPUT' as const, inputs: [] });
  nodes.push({ id: 'op[1]', gate: 'INPUT' as const, inputs: [] });
  nodes.push({ id: 'op[2]', gate: 'INPUT' as const, inputs: [] });

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `b_xor_op2[${i}]`, gate: 'XOR' as const, inputs: [`b[${i}]`, 'op[2]'] });
  }
  
  for (let i = 0; i < 8; i++) {
    const cin = i === 0 ? 'op[2]' : `carry[${i - 1}]`;
    nodes.push({ id: `add_xor1[${i}]`, gate: 'XOR' as const, inputs: [`a[${i}]`, `b_xor_op2[${i}]`] });
    nodes.push({ id: `add_sum[${i}]`, gate: 'XOR' as const, inputs: [`add_xor1[${i}]`, cin] });
    nodes.push({ id: `add_and1[${i}]`, gate: 'AND' as const, inputs: [`a[${i}]`, `b_xor_op2[${i}]`] });
    nodes.push({ id: `add_and2[${i}]`, gate: 'AND' as const, inputs: [cin, `add_xor1[${i}]`] });
    nodes.push({ id: `carry[${i}]`, gate: 'OR' as const, inputs: [`add_and1[${i}]`, `add_and2[${i}]`] });
  }

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `band[${i}]`, gate: 'AND' as const, inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bor[${i}]`, gate: 'OR' as const, inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bxor[${i}]`, gate: 'XOR' as const, inputs: [`a[${i}]`, `b[${i}]`] });
    nodes.push({ id: `bnot[${i}]`, gate: 'NOT' as const, inputs: [`a[${i}]`] });
  }

  nodes.push({ id: 'not_op2', gate: 'NOT' as const, inputs: ['op[2]'] });
  nodes.push({ id: 'not_op1', gate: 'NOT' as const, inputs: ['op[1]'] });
  nodes.push({ id: 'not_op0', gate: 'NOT' as const, inputs: ['op[0]'] });
  
  nodes.push({ id: 'sel_addsub', gate: 'AND' as const, inputs: ['not_op2', 'not_op1'] });
  nodes.push({ id: 'sel_and', gate: 'AND' as const, inputs: ['not_op2', 'op[1]', 'not_op0'] });
  nodes.push({ id: 'sel_or', gate: 'AND' as const, inputs: ['not_op2', 'op[1]', 'op[0]'] });
  nodes.push({ id: 'sel_xor', gate: 'AND' as const, inputs: ['op[2]', 'not_op1', 'not_op0'] });
  nodes.push({ id: 'sel_not', gate: 'AND' as const, inputs: ['op[2]', 'not_op1', 'op[0]'] });

  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `mux_and1[${i}]`, gate: 'AND' as const, inputs: ['sel_addsub', `add_sum[${i}]`] });
    nodes.push({ id: `mux_and2[${i}]`, gate: 'AND' as const, inputs: ['sel_and', `band[${i}]`] });
    nodes.push({ id: `mux_and3[${i}]`, gate: 'AND' as const, inputs: ['sel_or', `bor[${i}]`] });
    nodes.push({ id: `mux_and4[${i}]`, gate: 'AND' as const, inputs: ['sel_xor', `bxor[${i}]`] });
    nodes.push({ id: `mux_and5[${i}]`, gate: 'AND' as const, inputs: ['sel_not', `bnot[${i}]`] });
    
    nodes.push({ id: `mux_or12[${i}]`, gate: 'OR' as const, inputs: [`mux_and1[${i}]`, `mux_and2[${i}]`] });
    nodes.push({ id: `mux_or34[${i}]`, gate: 'OR' as const, inputs: [`mux_and3[${i}]`, `mux_and4[${i}]`] });
    nodes.push({ id: `mux_or1234[${i}]`, gate: 'OR' as const, inputs: [`mux_or12[${i}]`, `mux_or34[${i}]`] });
    nodes.push({ id: `out[${i}]`, gate: 'OR' as const, inputs: [`mux_or1234[${i}]`, `mux_and5[${i}]`] });
  }

  nodes.push({ id: 'carry_out', gate: 'BUF' as const, inputs: ['carry[7]'] });

  return { nodes };
}

const engine = new HumanComputerEngine(createALU8());

console.log('--- 测试 ADD: 3 + 5 ---');

// 设置输入
for (let i = 0; i < 8; i++) {
  engine.setInput(`a[${i}]`, ((3 >> i) & 1) as 0 | 1);
  engine.setInput(`b[${i}]`, ((5 >> i) & 1) as 0 | 1);
}
engine.setInput('op[0]', 0);
engine.setInput('op[1]', 0);
engine.setInput('op[2]', 0);

console.log('\n计算前:');
console.log('a[0]:', engine.getNodeState('a[0]'), 'a[1]:', engine.getNodeState('a[1]'));
console.log('b[0]:', engine.getNodeState('b[0]'), 'b[1]:', engine.getNodeState('b[1]'), 'b[2]:', engine.getNodeState('b[2]'));
console.log('op[0]:', engine.getNodeState('op[0]'), 'op[1]:', engine.getNodeState('op[1]'), 'op[2]:', engine.getNodeState('op[2]'));

const result = engine.compute();

console.log('\n计算后:');
console.log('not_op0:', engine.getNodeState('not_op0'));
console.log('not_op1:', engine.getNodeState('not_op1'));
console.log('not_op2:', engine.getNodeState('not_op2'));
console.log('sel_addsub:', engine.getNodeState('sel_addsub'));
console.log('sel_and:', engine.getNodeState('sel_and'));
console.log('sel_or:', engine.getNodeState('sel_or'));
console.log('sel_xor:', engine.getNodeState('sel_xor'));
console.log('sel_not:', engine.getNodeState('sel_not'));

console.log('\n变化节点:');
for (const ch of result.changed) {
  console.log(`  ${ch.id}: ${ch.output}`);
}
