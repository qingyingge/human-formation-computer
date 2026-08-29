# human-formation-computer

人列计算机引擎 - 同步时序逻辑电路模拟器

## 功能

- 支持基本逻辑门: AND, OR, NOT, XOR, NAND, NOR, BUF
- 支持 INPUT 节点（外部可设置）
- 支持 MEMORY 节点（带写使能的D触发器）
- 支持环路（时序逻辑）
- 可配置的传播延迟
- 异步计算支持（用于前端动画）

## 安装

```bash
npm install human-formation-computer
```

## 快速开始

```typescript
import { HumanComputerEngine } from 'human-formation-computer';

// 定义电路
const circuit = {
  nodes: [
    { id: 'a', gate: 'INPUT', inputs: [] },
    { id: 'b', gate: 'INPUT', inputs: [] },
    { id: 'and_out', gate: 'AND', inputs: ['a', 'b'] },
  ]
};

// 创建引擎
const engine = new HumanComputerEngine(circuit, {
  propagationDelayMs: 100,  // 每层传播延迟100ms
});

// 设置输入
engine.setInput('a', 1);
engine.setInput('b', 1);

// 计算
const result = engine.compute();
console.log(engine.getNodeState('and_out'));  // 1
```

## API

### HumanComputerEngine

#### 构造函数

```typescript
constructor(circuit: CircuitDef, config?: Partial<EngineConfig>)
```

- `circuit`: 电路定义
- `config`: 配置选项
  - `propagationDelayMs`: 每层传播延迟（毫秒），默认100
  - `clockIntervalMs`: 时钟周期（毫秒），默认10000

#### 方法

- `compute(): ComputeResult` - 计算下一个时钟周期
- `setInput(nodeId: string, value: 0 | 1): void` - 设置输入节点
- `getNodeState(nodeId: string): 0 | 1` - 获取节点状态
- `reset(): void` - 重置所有状态为0
- `startClock(onTick: (result: ComputeResult) => void): void` - 启动自动时钟
- `stopClock(): void` - 停止自动时钟
- `computeLayer(layerIndex: number): Promise<LayerResult>` - 异步计算单层
- `computeWithTimestamps(): TimedNodeState[]` - 计算并返回带时间戳的结果

### 节点类型

#### INPUT
外部可设置的输入节点。

#### MEMORY
带写使能的存储器节点。

```typescript
{
  id: 'reg_1',
  gate: 'MEMORY',
  inputs: [],
  writeEnable: ['clk', 'write_en'],  // 所有写使能都为1时写入
  writeData: 'data_in',               // 写数据源
}
```

### 电路验证

- 检测重复的节点ID
- 检测引用不存在的节点
- 检测组合逻辑环（非法）
- MEMORY节点可以形成环（时序逻辑）

## 示例

### 8位ALU

```bash
npx ts-node examples/alu8.ts
```

支持操作：ADD, SUB, AND, OR, XOR, NOT

### 256字节RAM

```bash
npx ts-node examples/ram256.ts
```

256个存储单元，每单元8位

### 传播延迟演示

```bash
npx ts-node examples/demo.ts
```

展示如何使用异步计算和带时间戳的结果

## 性能

| 电路 | 节点数 | 层级数 | 计算时间 |
|------|--------|--------|----------|
| 8位ALU | 182 | 25 | < 5ms |
| 256字节RAM | 9490 | 16 | < 50ms |

## 许可证

MIT
