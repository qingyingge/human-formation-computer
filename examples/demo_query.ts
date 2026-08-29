import { HumanComputerEngine } from '../src';

/**
 * 演示：查询-回答式引擎
 * 引擎维护状态，前端按需查询
 */

function createDemoCircuit() {
  return {
    nodes: [
      // 输入
      { id: 'a', gate: 'INPUT' as const, inputs: [] },
      { id: 'b', gate: 'INPUT' as const, inputs: [] },
      
      // 第一层
      { id: 'not_a', gate: 'NOT' as const, inputs: ['a'] },
      { id: 'and1', gate: 'AND' as const, inputs: ['a', 'b'] },
      
      // 第二层
      { id: 'or1', gate: 'OR' as const, inputs: ['not_a', 'and1'] },
      
      // 输出
      { id: 'out', gate: 'BUF' as const, inputs: ['or1'] },
    ]
  };
}

function demo() {
  console.log('=== 查询-回答式引擎演示 ===\n');
  
  const circuit = createDemoCircuit();
  const engine = new HumanComputerEngine(circuit, {
    propagationDelayMs: 100,
    clockIntervalMs: 10000,
  });
  
  console.log('电路: a,b -> not_a,and1 -> or1 -> out');
  console.log('传播延迟: 100ms/层\n');
  
  // 使用固定时间戳进行模拟
  let simTime = 0;
  
  // 初始状态：a=0, b=0
  console.log('初始状态: a=0, b=0');
  console.log('预期: out = OR(NOT(0), AND(0,0)) = OR(1, 0) = 1\n');
  
  // 触发计算
  console.log('--- 触发计算 ---');
  const result1 = engine.compute(simTime);
  console.log('变化节点:', result1.changed.map(n => `${n.id}=${n.output}`).join(', '));
  console.log('待生效队列:', engine.getPendingChanges().length, '个');
  
  // 模拟时间流逝，生效所有变化
  simTime += 1000;
  console.log(`\n--- ${simTime}ms: 生效所有变化 ---`);
  const tick1 = engine.tick(simTime);
  console.log('生效节点:', tick1.activated.map(n => `${n.id}=${n.output}`).join(', '));
  console.log('out =', engine.query('out'));
  
  // 改变输入
  console.log('\n--- 改变输入: a=1, b=1 ---');
  engine.setInput('a', 1);
  engine.setInput('b', 1);
  
  console.log('预期: out = OR(NOT(1), AND(1,1)) = OR(0, 1) = 1');
  
  // 触发计算
  simTime += 100;
  const result2 = engine.compute(simTime);
  console.log('\n--- 触发计算 ---');
  console.log('变化节点:', result2.changed.map(n => `${n.id}=${n.output}`).join(', '));
  
  // 逐层生效
  simTime += 100;
  console.log(`\n--- ${simTime}ms: 第一层生效 ---`);
  let tick = engine.tick(simTime);
  console.log('生效节点:', tick.activated.map(n => `${n.id}=${n.output}`).join(', '));
  console.log('  out =', engine.query('out'));
  
  simTime += 100;
  console.log(`\n--- ${simTime}ms: 第二层生效 ---`);
  tick = engine.tick(simTime);
  console.log('生效节点:', tick.activated.map(n => `${n.id}=${n.output}`).join(', '));
  console.log('  out =', engine.query('out'));
  
  // 查询所有状态
  console.log('\n--- 最终状态 ---');
  const allStates = engine.queryAll();
  for (const [id, value] of allStates) {
    console.log(`  ${id} = ${value}`);
  }
  
  console.log('\n=== 演示完成 ===');
}

demo();
