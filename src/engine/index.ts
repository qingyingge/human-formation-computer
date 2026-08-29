export type {
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

export { HumanComputerEngine } from './engine';
export type { TickResult } from './engine';

export { evaluateGate } from './gate';

export { validateCircuit, CircuitValidationError, getCircuitStats } from './validator';

export { topologicalSort, getNodeLayer } from './topology';
