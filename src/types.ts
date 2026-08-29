// 逻辑门类型
export type GateType = 
  | 'AND'    // 与门：所有输入为1才输出1
  | 'OR'     // 或门：任意输入为1就输出1
  | 'NOT'    // 非门：输入取反
  | 'XOR'    // 异或门：奇数个输入为1则输出1
  | 'NAND'   // 与非门：与门取反
  | 'NOR'    // 或非门：或门取反
  | 'INPUT'  // 输入节点：外部可设置的输入
  | 'MEMORY' // 存储器：带写使能的D触发器
  | 'BUF';   // 缓冲器：输出等于输入

// 节点定义（静态，构建电路时确定）
export interface NodeDef {
  id: string;           // 唯一字符串ID，如 "alu.adder.carry"
  gate: GateType;
  inputs: string[];     // 逻辑门的输入节点ID
}

// 存储器节点定义
export interface MemoryNodeDef extends NodeDef {
  gate: 'MEMORY';
  writeEnable: string[];  // 写使能信号节点ID（1或2个）
  writeData: string;      // 写数据源节点ID
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
  timeMs: number;  // 该节点变化的时间（毫秒）
}

// 单层计算结果
export interface LayerResult {
  layerIndex: number;      // 层级索引
  timeMs: number;          // 该层计算完成的时间
  changed: NodeState[];    // 该层变化的节点
}

// 计算结果（触发计算时返回）
export interface ComputeResult {
  changed: NodeState[];        // 本次变化的节点
  layers: LayerResult[];       // 每层的计算结果
  totalTimeMs: number;         // 总计算时间
  tickTimeMs: number;          // 本次计算的时间戳
}

// 引擎配置
export interface EngineConfig {
  propagationDelayMs: number;  // 每层传播延迟（毫秒），默认0.1秒
  clockIntervalMs: number;     // 时钟周期（毫秒），默认10秒
}

// 状态快照（前端查询用）
export interface StateSnapshot {
  timestamp: number;           // 快照时间戳
  nodes: Map<string, 0 | 1>;  // 所有节点状态
}
