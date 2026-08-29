import { NodeDef, MemoryNodeDef, CircuitDef, ComputeResult, NodeState, EngineConfig, LayerResult } from './types';
import { evaluateGate } from './gate';
import { validateCircuit, getCircuitStats } from './validator';
import { topologicalSort } from './topology';

/**
 * 人列计算机引擎
 * 
 * 设计理念：
 * - 引擎维护一个状态缓冲区
 * - 调用 compute() 时，计算下一层应该变化的节点，放入待生效队列
 * - 调用 tick() 时，将待生效的节点状态真正生效
 * - 前端通过 query() 查询当前生效的状态
 * 
 * 这样前端可以：
 * 1. 在任意时刻查询任意节点的状态
 * 2. 根据自己的渲染能力决定查询频率
 * 3. 视口剔除：只查询可见区域的节点
 */
export class HumanComputerEngine {
  private nodeMap: Map<string, NodeDef>;
  private memoryNodes: MemoryNodeDef[];
  private layers: string[][];
  private config: EngineConfig;

  // 双缓冲状态
  private currentStates: Map<string, 0 | 1>;   // 当前生效的状态
  private pendingStates: Map<string, 0 | 1>;   // 待生效的状态
  private pendingQueue: PendingUpdate[];         // 待生效队列（按时间排序）

  // 计算状态
  private nextLayerToCompute: number = 0;  // 下次要计算的层级

  // 时钟
  private clockTimer: ReturnType<typeof setInterval> | null = null;
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

    // 初始化状态
    this.currentStates = new Map();
    this.pendingStates = new Map();
    this.pendingQueue = [];
    for (const node of circuit.nodes) {
      this.currentStates.set(node.id, 0);
      this.pendingStates.set(node.id, 0);
    }
  }

  /**
   * 设置输入节点
   */
  setInput(nodeId: string, value: 0 | 1): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) throw new Error(`节点不存在: ${nodeId}`);
    if (node.gate !== 'INPUT') throw new Error(`节点 "${nodeId}" 不是INPUT类型`);
    this.currentStates.set(nodeId, value);
    this.pendingStates.set(nodeId, value);
  }

  /**
   * 批量设置输入
   */
  setInputs(inputs: Record<string, 0 | 1>): void {
    for (const [id, value] of Object.entries(inputs)) {
      this.setInput(id, value);
    }
  }

  /**
   * 触发一次完整计算
   * 计算所有层级，将结果放入待生效队列
   * 
   * @param baseTimeMs 基准时间（毫秒），用于计算生效时间
   *                   如果不传，使用内部维护的时钟
   */
  compute(baseTimeMs?: number): ComputeResult {
    // 捕获当前输入作为快照
    const snapshot = new Map(this.currentStates);
    this.nextLayerToCompute = 0;

    const layerResults: LayerResult[] = [];
    let currentTimeMs = 0;
    const baseTime = baseTimeMs ?? (this.lastTickTimeMs + this.config.clockIntervalMs);

    // 计算所有非MEMORY节点
    for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
      const layer = this.layers[layerIdx];
      const layerChanged: NodeState[] = [];

      for (const nodeId of layer) {
        const node = this.nodeMap.get(nodeId);
        if (!node || node.gate === 'MEMORY' || node.gate === 'INPUT') continue;

        const inputs = node.inputs.map(id => snapshot.get(id) ?? 0);
        const output = evaluateGate(node.gate, inputs as (0 | 1)[]);

        // 更新快照，以便后续层能读到新值
        snapshot.set(nodeId, output);

        if (this.pendingStates.get(nodeId) !== output) {
          this.pendingStates.set(nodeId, output);
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

    // 计算MEMORY节点
    const memChanged: NodeState[] = [];
    for (const mem of this.memoryNodes) {
      const writeEnables = mem.writeEnable.map(id => snapshot.get(id) ?? 0);
      const writeData = snapshot.get(mem.writeData) ?? 0;

      if (writeEnables.every(x => x === 1)) {
        if (this.pendingStates.get(mem.id) !== writeData) {
          this.pendingStates.set(mem.id, writeData);
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

  /**
   * 生效待处理的更新
   * 将已过传播延迟的节点状态从pending移到current
   * 
   * @param currentTimeMs 当前时间（毫秒），用于判断哪些更新应该生效
   */
  tick(currentTimeMs?: number): TickResult {
    const now = currentTimeMs ?? Date.now();
    const activated: NodeState[] = [];

    // 找出所有应该生效的更新
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

  /**
   * 查询单个节点的当前状态
   */
  query(nodeId: string): 0 | 1 {
    return this.currentStates.get(nodeId) ?? 0;
  }

  /**
   * 批量查询节点状态
   * 前端可以只查询视口内的节点
   */
  queryBatch(nodeIds: string[]): Map<string, 0 | 1> {
    const result = new Map<string, 0 | 1>();
    for (const id of nodeIds) {
      result.set(id, this.currentStates.get(id) ?? 0);
    }
    return result;
  }

  /**
   * 查询所有节点状态
   * 注意：节点多时慎用
   */
  queryAll(): Map<string, 0 | 1> {
    return new Map(this.currentStates);
  }

  /**
   * 查询指定区域的节点（如果节点ID有规律）
   * 例如查询 "alu.adder.*" 开头的节点
   */
  queryByPattern(pattern: string): Map<string, 0 | 1> {
    const result = new Map<string, 0 | 1>();
    for (const [id, value] of this.currentStates) {
      if (id.startsWith(pattern) || id.includes(pattern)) {
        result.set(id, value);
      }
    }
    return result;
  }

  /**
   * 获取待生效队列中的变化（用于前端预测）
   */
  getPendingChanges(): PendingUpdate[] {
    return [...this.pendingQueue];
  }

  /**
   * 启动自动时钟
   */
  startClock(onTick?: (result: TickResult) => void): void {
    if (this.clockTimer) this.stopClock();

    this.lastTickTimeMs = Date.now();
    this.clockTimer = setInterval(() => {
      // 先触发一次计算
      this.compute();
      
      // 然后生效
      const result = this.tick();
      
      if (onTick) onTick(result);
    }, this.config.clockIntervalMs);
  }

  /**
   * 停止自动时钟
   */
  stopClock(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    for (const [id] of this.currentStates) {
      this.currentStates.set(id, 0);
      this.pendingStates.set(id, 0);
    }
    this.pendingQueue = [];
  }

  /**
   * 获取节点定义
   */
  getNode(nodeId: string): NodeDef | undefined {
    return this.nodeMap.get(nodeId);
  }

  /**
   * 获取所有节点ID
   */
  getAllNodeIds(): string[] {
    return Array.from(this.nodeMap.keys());
  }

  /**
   * 获取输入节点ID
   */
  getInputNodeIds(): string[] {
    return Array.from(this.nodeMap.entries())
      .filter(([_, node]) => node.gate === 'INPUT')
      .map(([id, _]) => id);
  }

  /**
   * 获取存储器节点ID
   */
  getMemoryNodeIds(): string[] {
    return this.memoryNodes.map(n => n.id);
  }

  /**
   * 获取电路统计
   */
  getStats() {
    return getCircuitStats({ nodes: Array.from(this.nodeMap.values()) });
  }

  /**
   * 获取拓扑层级
   */
  getLayers(): string[][] {
    return this.layers;
  }

  /**
   * 获取配置
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }
}

// 内部类型
interface PendingUpdate {
  nodeId: string;
  value: 0 | 1;
  activateAtMs: number;  // 这个更新应该在什么时间生效
}

// Tick结果
export interface TickResult {
  activated: NodeState[];  // 本次生效的节点
  timestamp: number;       // 生效时间
  pendingCount: number;    // 队列中剩余的待生效数量
}
