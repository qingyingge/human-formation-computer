// 逻辑门类型
export type GateType =
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'XOR'
  | 'NAND'
  | 'NOR'
  | 'INPUT'
  | 'MEMORY'
  | 'BUF';

// 节点定义（静态，构建电路时确定）
export interface NodeDef {
  id: string;
  gate: GateType;
  inputs: string[];
}

// 存储器节点定义
export interface MemoryNodeDef extends NodeDef {
  gate: 'MEMORY';
  writeEnable: string[];
  writeData: string;
}

// 电路定义
export interface CircuitDef {
  nodes: NodeDef[];
}

// 节点状态（运行时）
export interface NodeState {
  id: string;
  output: 0 | 1;
}

// 带时间戳的节点状态（用于传播延迟）
export interface TimedNodeState extends NodeState {
  timeMs: number;
}

// 单层计算结果
export interface LayerResult {
  layerIndex: number;
  timeMs: number;
  changed: NodeState[];
}

// 计算结果（触发计算时返回）
export interface ComputeResult {
  changed: NodeState[];
  layers: LayerResult[];
  totalTimeMs: number;
  tickTimeMs: number;
}

// 引擎配置
export interface EngineConfig {
  propagationDelayMs: number;
  clockIntervalMs: number;
}

// 状态快照（前端查询用）
export interface StateSnapshot {
  timestamp: number;
  nodes: Map<string, 0 | 1>;
}
