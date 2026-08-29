import type { NodeDef, MemoryNodeDef, CircuitDef, ComputeResult, NodeState, EngineConfig, LayerResult } from './types';
import { evaluateGate } from './gate';
import { validateCircuit, getCircuitStats } from './validator';
import { topologicalSort } from './topology';

interface PendingUpdate {
  nodeId: string;
  value: 0 | 1;
  activateAtMs: number;
}

export interface TickResult {
  activated: NodeState[];
  timestamp: number;
  pendingCount: number;
}

export class HumanComputerEngine {
  private nodeMap: Map<string, NodeDef>;
  private memoryNodes: MemoryNodeDef[];
  private layers: string[][];
  private config: EngineConfig;

  private currentStates: Map<string, 0 | 1>;
  private pendingQueue: PendingUpdate[];

  private lastTickTimeMs: number = 0;

  constructor(circuit: CircuitDef, config?: Partial<EngineConfig>) {
    validateCircuit(circuit);

    this.nodeMap = new Map();
    for (const node of circuit.nodes) {
      this.nodeMap.set(node.id, node);
    }

    this.memoryNodes = circuit.nodes
      .filter(n => n.gate === 'MEMORY')
      .map(n => n as MemoryNodeDef);

    this.layers = topologicalSort(circuit.nodes);

    this.config = {
      propagationDelayMs: config?.propagationDelayMs ?? 100,
      clockIntervalMs: config?.clockIntervalMs ?? 10000,
    };

    this.currentStates = new Map();
    this.pendingQueue = [];
    for (const node of circuit.nodes) {
      this.currentStates.set(node.id, 0);
    }
  }

  setInput(nodeId: string, value: 0 | 1): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) throw new Error(`节点不存在: ${nodeId}`);
    if (node.gate !== 'INPUT') throw new Error(`节点 "${nodeId}" 不是INPUT类型`);
    this.currentStates.set(nodeId, value);
  }

  setInputs(inputs: Record<string, 0 | 1>): void {
    for (const [id, value] of Object.entries(inputs)) {
      this.setInput(id, value as 0 | 1);
    }
  }

  compute(baseTimeMs?: number): ComputeResult {
    const snapshot = new Map(this.currentStates);

    const layerResults: LayerResult[] = [];
    let currentTimeMs = 0;
    const baseTime = baseTimeMs ?? (this.lastTickTimeMs + this.config.clockIntervalMs);

    for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
      const layer = this.layers[layerIdx];
      const layerChanged: NodeState[] = [];

      for (const nodeId of layer) {
        const node = this.nodeMap.get(nodeId);
        if (!node || node.gate === 'MEMORY' || node.gate === 'INPUT') continue;

        const inputs = node.inputs.map(id => snapshot.get(id) ?? 0);
        const output = evaluateGate(node.gate, inputs as (0 | 1)[]);

        snapshot.set(nodeId, output);

        if (this.currentStates.get(nodeId) !== output) {
          this.pendingQueue.push({
            nodeId,
            value: output,
            activateAtMs: baseTime + currentTimeMs,
          });
          layerChanged.push({ id: nodeId, output });
        }
      }

      if (layerChanged.length > 0) {
        layerResults.push({
          layerIndex: layerIdx,
          timeMs: currentTimeMs,
          changed: layerChanged,
        });
      }
      currentTimeMs += this.config.propagationDelayMs;
    }

    const memChanged: NodeState[] = [];
    for (const mem of this.memoryNodes) {
      const writeEnables = mem.writeEnable.map(id => snapshot.get(id) ?? 0);
      const writeData = snapshot.get(mem.writeData) ?? 0;

      if (writeEnables.every(x => x === 1)) {
        if (this.currentStates.get(mem.id) !== writeData) {
          this.pendingQueue.push({
            nodeId: mem.id,
            value: writeData,
            activateAtMs: baseTime + currentTimeMs,
          });
          memChanged.push({ id: mem.id, output: writeData });
        }
      }
    }

    if (memChanged.length > 0) {
      layerResults.push({
        layerIndex: this.layers.length,
        timeMs: currentTimeMs,
        changed: memChanged,
      });
    }

    return {
      changed: [...layerResults.flatMap(l => l.changed)],
      layers: layerResults,
      totalTimeMs: currentTimeMs,
      tickTimeMs: baseTime,
    };
  }

  tick(currentTimeMs?: number): TickResult {
    const now = currentTimeMs ?? Date.now();
    const activated: NodeState[] = [];

    const remaining: PendingUpdate[] = [];
    for (const update of this.pendingQueue) {
      if (update.activateAtMs <= now) {
        this.currentStates.set(update.nodeId, update.value);
        activated.push({ id: update.nodeId, output: update.value });
        this.lastTickTimeMs = now;
      } else {
        remaining.push(update);
      }
    }
    this.pendingQueue = remaining;

    return {
      activated,
      timestamp: now,
      pendingCount: this.pendingQueue.length,
    };
  }

  query(nodeId: string): 0 | 1 {
    return this.currentStates.get(nodeId) ?? 0;
  }

  queryBatch(nodeIds: string[]): Map<string, 0 | 1> {
    const result = new Map<string, 0 | 1>();
    for (const id of nodeIds) {
      result.set(id, this.currentStates.get(id) ?? 0);
    }
    return result;
  }

  queryAll(): Map<string, 0 | 1> {
    return new Map(this.currentStates);
  }

  getPendingChanges(): PendingUpdate[] {
    return [...this.pendingQueue];
  }

  startClock(onTick?: (result: TickResult) => void): void {
    this.stopClock();
    this.lastTickTimeMs = Date.now();
    this._clockInterval = setInterval(() => {
      this.compute();
      const result = this.tick();
      if (onTick) onTick(result);
    }, this.config.clockIntervalMs);
  }

  private _clockInterval: ReturnType<typeof setInterval> | null = null;

  stopClock(): void {
    if (this._clockInterval) {
      clearInterval(this._clockInterval);
      this._clockInterval = null;
    }
  }

  reset(): void {
    for (const [id] of this.currentStates) {
      this.currentStates.set(id, 0);
    }
    this.pendingQueue = [];
  }

  getNode(nodeId: string): NodeDef | undefined {
    return this.nodeMap.get(nodeId);
  }

  getAllNodeIds(): string[] {
    return Array.from(this.nodeMap.keys());
  }

  getInputNodeIds(): string[] {
    return Array.from(this.nodeMap.entries())
      .filter(([_, node]) => node.gate === 'INPUT')
      .map(([id, _]) => id);
  }

  getMemoryNodeIds(): string[] {
    return this.memoryNodes.map(n => n.id);
  }

  getStats() {
    return getCircuitStats({ nodes: Array.from(this.nodeMap.values()) });
  }

  getLayers(): string[][] {
    return this.layers;
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }
}
