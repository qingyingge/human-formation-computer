import { HumanComputerEngine } from '../src';

/**
 * 演示：带传播延迟的异步计算
 * 展示如何使用computeWithTimestamps获取带时间戳的结果
 */

function createDemoCircuit() {
  return {
    nodes: [
      // 输入
      { id: 'a', gate: 'INPUT' as const, inputs: [] },
      { id: 'b', gate: 'INPUT' as const, inputs: [] },
      
      // 第一层：NOT门
      { id: 'not_a', gate: 'NOT' as const, inputs: ['a'] },
      { id: 'not_b', gate: 'NOT' as const, inputs: ['b'] },
      
      // 第二层：AND门
      { id: 'and1', gate: 'AND' as const, inputs: ['a', 'b'] },
      { id: 'and2', gate: 'AND' as const, inputs: ['not_a', 'not_b'] },
      
      // 第三层：OR门
      { id: 'or1', gate: 'OR' as const, inputs: ['and1', 'and2'] },
      
      // 输出
      { id: 'out', gate: 'BUF' as const, inputs: ['or1'] },
    ]
  };
}

async function demoAsync() {
  console.log('=== 传播延迟演示 ===\n');
  
  const circuit = createDemoCircuit();
  const engine = new HumanComputerEngine(circuit, { propagationDelayMs: 100 });
  
  console.log('电路深度:', engine.getLayers().length, '层');
  console.log('每层传播延迟: 100ms');
  console.log('总传播延迟:', engine.getLayers().length * 100, 'ms\n');
  
  // 设置输入
  engine.setInput('a', 1);
  engine.setInput('b', 0);
  
  console.log('输入: a=1, b=0');
  console.log('预期输出: out=0 (因为 a XOR b = 1, 这里我们用 AND-NOT 组合)\n');
  
  // 方式1：同步计算
  console.log('--- 方式1：同步计算 ---');
  const startTime = Date.now();
  const result = engine.compute();
  const endTime = Date.now();
  
  console.log(`计算耗时: ${endTime - startTime}ms (实际是瞬时的，只是API调用开销)`);
  console.log('输出结果:', engine.getNodeState('out'));
  console.log('变化节点数:', result.changed.length);
  console.log('总传播时间:', result.totalTimeMs, 'ms\n');
  
  // 方式2：带时间戳的结果
  console.log('--- 方式2：带时间戳的结果 ---');
  engine.reset();
  engine.setInput('a', 1);
  engine.setInput('b', 0);
  
  const timedResult = engine.computeWithTimestamps();
  console.log('变化节点（按时间排序）:');
  for (const state of timedResult) {
    console.log(`  t=${state.timeMs}ms: ${state.id} = ${state.output}`);
  }
  console.log();
  
  // 方式3：异步逐层计算（可用于前端动画）
  console.log('--- 方式3：异步逐层计算 ---');
  engine.reset();
  engine.setInput('a', 1);
  engine.setInput('b', 0);
  
  console.log('逐层计算:');
  for (let i = 0; i < engine.getLayers().length; i++) {
    const layerResult = await engine.computeLayer(i);
    if (layerResult && layerResult.changed.length > 0) {
      console.log(`  Layer ${i} (t=${layerResult.timeMs}ms):`);
      for (const state of layerResult.changed) {
        console.log(`    ${state.id} = ${state.output}`);
      }
    }
    // 模拟前端动画延迟
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n=== 演示完成 ===');
}

demoAsync();
