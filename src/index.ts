// 类型定义
export {
  GateType,
  NodeDef,
  MemoryNodeDef,
  CircuitDef,
  NodeState,
  TimedNodeState,
  ComputeResult,
  LayerResult,
  EngineConfig,
  StateSnapshot,
} from './types';

// 核心引擎
export { HumanComputerEngine, TickResult } from './engine';

// 逻辑门求值
export { evaluateGate, getTruthTable } from './gate';

// 电路验证
export { validateCircuit, CircuitValidationError, getCircuitStats } from './validator';

// 拓扑排序
export { topologicalSort, getNodeLayer, getDependencyDepth } from './topology';
