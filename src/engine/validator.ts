import type { NodeDef, MemoryNodeDef, CircuitDef } from './types';

export class CircuitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitValidationError';
  }
}

export function validateCircuit(circuit: CircuitDef): void {
  const { nodes } = circuit;
  const nodeMap = new Map<string, NodeDef>();

  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      throw new CircuitValidationError(`重复的节点ID: ${node.id}`);
    }
    nodeMap.set(node.id, node);
  }

  for (const node of nodes) {
    for (const inputId of node.inputs) {
      if (!nodeMap.has(inputId)) {
        throw new CircuitValidationError(
          `节点 "${node.id}" 引用了不存在的输入节点: ${inputId}`
        );
      }
    }

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

  const nonMemoryNodes = nodes.filter(n => n.gate !== 'MEMORY');
  const nonMemoryIds = new Set(nonMemoryNodes.map(n => n.id));

  const deps = new Map<string, string[]>();
  for (const node of nonMemoryNodes) {
    const filteredInputs = node.inputs.filter(id => nonMemoryIds.has(id));
    deps.set(node.id, filteredInputs);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;

  function dfs(nodeId: string, path: string[]): void {
    if (hasCycle) return;
    if (inStack.has(nodeId)) {
      hasCycle = true;
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
    throw new CircuitValidationError('检测到组合逻辑环');
  }
}

export function getCircuitStats(circuit: CircuitDef) {
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
