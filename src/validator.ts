import { NodeDef, MemoryNodeDef, CircuitDef } from './types';

export class CircuitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitValidationError';
  }
}

/**
 * 验证电路定义
 * 1. 检查所有节点ID唯一
 * 2. 检查所有引用的输入节点存在
 * 3. 检查组合逻辑环（不经过MEMORY节点的环）
 */
export function validateCircuit(circuit: CircuitDef): void {
  const { nodes } = circuit;
  const nodeMap = new Map<string, NodeDef>();

  // 1. 检查节点ID唯一性
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      throw new CircuitValidationError(`重复的节点ID: ${node.id}`);
    }
    nodeMap.set(node.id, node);
  }

  // 2. 检查所有引用的节点存在
  for (const node of nodes) {
    // 检查 inputs
    for (const inputId of node.inputs) {
      if (!nodeMap.has(inputId)) {
        throw new CircuitValidationError(
          `节点 "${node.id}" 引用了不存在的输入节点: ${inputId}`
        );
      }
    }

    // 检查 MEMORY 节点的特殊引用
    if (node.gate === 'MEMORY') {
      const memNode = node as MemoryNodeDef;
      for (const weId of memNode.writeEnable) {
        if (!nodeMap.has(weId)) {
          throw new CircuitValidationError(
            `MEMORY节点 "${node.id}" 引用了不存在的写使能节点: ${weId}`
          );
        }
      }
      if (!nodeMap.has(memNode.writeData)) {
        throw new CircuitValidationError(
          `MEMORY节点 "${node.id}" 引用了不存在的写数据节点: ${memNode.writeData}`
        );
      }
    }
  }

  // 3. 检查组合逻辑环
  // 只考虑非MEMORY节点的依赖关系，检测是否有环
  const nonMemoryNodes = nodes.filter(n => n.gate !== 'MEMORY');
  const nonMemoryIds = new Set(nonMemoryNodes.map(n => n.id));

  // 构建非MEMORY节点的依赖图
  const deps = new Map<string, string[]>();
  for (const node of nonMemoryNodes) {
    // 只保留对非MEMORY节点的依赖
    const filteredInputs = node.inputs.filter(id => nonMemoryIds.has(id));
    deps.set(node.id, filteredInputs);
  }

  // DFS检测环
  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;
  let cyclePath: string[] = [];

  function dfs(nodeId: string, path: string[]): void {
    if (hasCycle) return;
    if (inStack.has(nodeId)) {
      // 找到环
      hasCycle = true;
      const cycleStart = path.indexOf(nodeId);
      cyclePath = path.slice(cycleStart).concat(nodeId);
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const inputs = deps.get(nodeId) || [];
    for (const inputId of inputs) {
      dfs(inputId, [...path]);
      if (hasCycle) return;
    }

    inStack.delete(nodeId);
  }

  for (const nodeId of nonMemoryIds) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
      if (hasCycle) break;
    }
  }

  if (hasCycle) {
    throw new CircuitValidationError(
      `检测到组合逻辑环: ${cyclePath.join(' -> ')}`
    );
  }
}

/**
 * 获取电路的统计信息
 */
export function getCircuitStats(circuit: CircuitDef): {
  totalNodes: number;
  memoryNodes: number;
  inputNodes: number;
  gateNodes: number;
  maxFanIn: number;
  maxFanOut: number;
} {
  const { nodes } = circuit;
  const fanOut = new Map<string, number>();

  let memoryNodes = 0;
  let inputNodes = 0;
  let gateNodes = 0;
  let maxFanIn = 0;

  for (const node of nodes) {
    if (node.gate === 'MEMORY') memoryNodes++;
    else if (node.gate === 'INPUT') inputNodes++;
    else gateNodes++;

    maxFanIn = Math.max(maxFanIn, node.inputs.length);

    // 统计 fan-out
    for (const inputId of node.inputs) {
      fanOut.set(inputId, (fanOut.get(inputId) || 0) + 1);
    }
  }

  const maxFanOut = Math.max(0, ...Array.from(fanOut.values()));

  return {
    totalNodes: nodes.length,
    memoryNodes,
    inputNodes,
    gateNodes,
    maxFanIn,
    maxFanOut,
  };
}
