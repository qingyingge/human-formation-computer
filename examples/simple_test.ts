import { HumanComputerEngine } from '../src';

function createSimpleCircuit() {
  return {
    nodes: [
      { id: 'a', gate: 'INPUT' as const, inputs: [] },
      { id: 'b', gate: 'INPUT' as const, inputs: [] },
      { id: 'and_out', gate: 'AND' as const, inputs: ['a', 'b'] },
    ]
  };
}

const engine = new HumanComputerEngine(createSimpleCircuit());

console.log('初始状态:');
console.log('a:', engine.getNodeState('a'));
console.log('b:', engine.getNodeState('b'));
console.log('and_out:', engine.getNodeState('and_out'));

engine.setInput('a', 1);
engine.setInput('b', 1);

console.log('\n设置输入后 (compute前):');
console.log('a:', engine.getNodeState('a'));
console.log('b:', engine.getNodeState('b'));
console.log('and_out:', engine.getNodeState('and_out'));

engine.compute();

console.log('\ncompute后:');
console.log('a:', engine.getNodeState('a'));
console.log('b:', engine.getNodeState('b'));
console.log('and_out:', engine.getNodeState('and_out'));
