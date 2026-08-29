import { NodeDef, MemoryNodeDef, CircuitDef, HumanComputerEngine } from '../src';

/**
 * 256字节RAM
 * 
 * 规格：
 * - 256个存储单元，每单元8位
 * - 8位地址线 (addr[7:0])
 * - 8位数据输入 (data_in[7:0])
 * - 8位数据输出 (data_out[7:0])
 * - 写使能 (write_en)
 * - 时钟 (clk)
 */

function createRAM256(): CircuitDef {
  const nodes: NodeDef[] = [];

  // === 输入节点 ===
  // 地址线
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `addr[${i}]`, gate: 'INPUT', inputs: [] });
  }
  // 数据输入
  for (let i = 0; i < 8; i++) {
    nodes.push({ id: `data_in[${i}]`, gate: 'INPUT', inputs: [] });
  }
  // 控制信号
  nodes.push({ id: 'write_en', gate: 'INPUT', inputs: [] });
  nodes.push({ id: 'clk', gate: 'INPUT', inputs: [] });

  // === 1. 地址解码器 ===
  // 将8位地址解码为256个选择信号
  // 当地址匹配时，对应的选择信号为1
  
  // 预计算地址位的真值（用于验证）
  // addr_match[k] = 1 当且仅当 addr 的二进制表示等于 k
  
  // 使用组合逻辑解码
  // 对于每个地址 k (0-255)，计算 addr_match[k]
  for (let k = 0; k < 256; k++) {
    const bits: string[] = [];
    for (let i = 0; i < 8; i++) {
      const bit = (k >> i) & 1;
      const nodeId = `addr_bit_match_${k}_${i}`;
      if (bit === 1) {
        // 需要 addr[i] = 1
        bits.push(`addr[${i}]`);
      } else {
        // 需要 addr[i] = 0
        nodes.push({ id: nodeId, gate: 'NOT', inputs: [`addr[${i}]`] });
        bits.push(nodeId);
      }
    }
    // 所有位都匹配时，选择此地址
    // 使用树状与门
    let currentLevel = bits;
    let layerIdx = 0;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let j = 0; j < currentLevel.length; j += 2) {
        if (j + 1 < currentLevel.length) {
          const andId = `addr_decode_${k}_L${layerIdx}_${j}`;
          nodes.push({ id: andId, gate: 'AND', inputs: [currentLevel[j], currentLevel[j + 1]] });
          nextLevel.push(andId);
        } else {
          nextLevel.push(currentLevel[j]);
        }
      }
      currentLevel = nextLevel;
      layerIdx++;
    }
    nodes.push({ id: `addr_match[${k}]`, gate: 'BUF', inputs: [currentLevel[0]] });
  }

  // === 2. 存储单元（256个8位寄存器）===
  for (let k = 0; k < 256; k++) {
    // 写使能 = addr_match[k] AND write_en
    nodes.push({ id: `we_${k}`, gate: 'AND', inputs: [`addr_match[${k}]`, 'write_en'] });
    
    // 8位寄存器
    for (let b = 0; b < 8; b++) {
      nodes.push({
        id: `mem_${k}_${b}`,
        gate: 'MEMORY',
        inputs: [],
        writeEnable: [`we_${k}`, 'clk'],
        writeData: `data_in[${b}]`,
      } as MemoryNodeDef);
    }
  }

  // === 3. 输出多路选择器 ===
  // 根据地址选择输出哪个存储单元的数据
  for (let b = 0; b < 8; b++) {
    // 256选1的多路选择器
    // out_b = OR over k of (addr_match[k] AND mem_k_b)
    
    // 第一层：计算 addr_match[k] AND mem_k_b
    for (let k = 0; k < 256; k++) {
      nodes.push({ id: `mux_${b}_${k}`, gate: 'AND', inputs: [`addr_match[${k}]`, `mem_${k}_${b}`] });
    }
    
    // 第二层：树状或门
    let currentLevel: string[] = [];
    for (let k = 0; k < 256; k++) {
      currentLevel.push(`mux_${b}_${k}`);
    }
    
    let layerIdx = 0;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let j = 0; j < currentLevel.length; j += 2) {
        if (j + 1 < currentLevel.length) {
          const orId = `mux_or_${b}_L${layerIdx}_${j}`;
          nodes.push({ id: orId, gate: 'OR', inputs: [currentLevel[j], currentLevel[j + 1]] });
          nextLevel.push(orId);
        } else {
          nextLevel.push(currentLevel[j]);
        }
      }
      currentLevel = nextLevel;
      layerIdx++;
    }
    
    nodes.push({ id: `data_out[${b}]`, gate: 'BUF', inputs: [currentLevel[0]] });
  }

  return { nodes };
}

// 辅助函数
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

function setAddr(engine: HumanComputerEngine, addr: number): void {
  setByte(engine, 'addr', addr);
}

// 计算并等待生效
function computeAndWait(engine: HumanComputerEngine): void {
  engine.compute(0);
  engine.tick(100000);  // 等待所有传播完成
}

// 测试
function testRAM256() {
  console.log('=== 256字节RAM测试 ===\n');
  
  const circuit = createRAM256();
  const engine = new HumanComputerEngine(circuit, { propagationDelayMs: 100 });
  
  console.log('电路统计:', engine.getStats());
  console.log('传播延迟:', engine.getLayers().length * 100, 'ms');
  
  // 测试1：写入数据
  console.log('\n--- 测试1：写入数据 ---');
  
  // 地址 0x10，数据 0xAB
  setAddr(engine, 0x10);
  setByte(engine, 'data_in', 0xAB);
  engine.setInput('write_en', 1);
  engine.setInput('clk', 0);
  computeAndWait(engine);
  
  // 触发时钟上升沿
  engine.setInput('clk', 1);
  computeAndWait(engine);
  
  // 关闭写使能
  engine.setInput('write_en', 0);
  engine.setInput('clk', 0);
  computeAndWait(engine);
  
  const read1 = getByte(engine, 'data_out');
  console.log(`地址 0x10 写入 0xAB，读出: 0x${read1.toString(16).toUpperCase().padStart(2, '0')}`);
  console.log(`预期: 0xAB`);
  console.log(`结果: ${read1 === 0xAB ? '✓' : '✗'}`);
  
  // 测试2：写入多个地址
  console.log('\n--- 测试2：写入多个地址 ---');
  
  const testData = [
    { addr: 0x00, data: 0x11 },
    { addr: 0x01, data: 0x22 },
    { addr: 0x02, data: 0x33 },
    { addr: 0xFF, data: 0xFF },
  ];
  
  for (const { addr, data } of testData) {
    setAddr(engine, addr);
    setByte(engine, 'data_in', data);
    engine.setInput('write_en', 1);
    engine.setInput('clk', 0);
    computeAndWait(engine);
    engine.setInput('clk', 1);
    computeAndWait(engine);
    engine.setInput('write_en', 0);
    engine.setInput('clk', 0);
    computeAndWait(engine);
  }
  
  // 读回验证
  let allPassed = true;
  for (const { addr, data } of testData) {
    setAddr(engine, addr);
    engine.setInput('write_en', 0);
    computeAndWait(engine);
    
    const read = getByte(engine, 'data_out');
    const status = read === data ? '✓' : '✗';
    if (read !== data) allPassed = false;
    console.log(`地址 0x${addr.toString(16).toUpperCase().padStart(2, '0')}: 读出 0x${read.toString(16).toUpperCase().padStart(2, '0')} ${status}`);
  }
  
  // 测试3：验证地址0x10仍然是0xAB
  console.log('\n--- 测试3：验证之前的数据保持 ---');
  setAddr(engine, 0x10);
  computeAndWait(engine);
  const read2 = getByte(engine, 'data_out');
  console.log(`地址 0x10: 读出 0x${read2.toString(16).toUpperCase().padStart(2, '0')} ${read2 === 0xAB ? '✓' : '✗'}`);
  
  console.log('\n=== 测试完成 ===');
}

testRAM256();
