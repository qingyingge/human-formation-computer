import { NodeDef, MemoryNodeDef } from './types';

/**
 * 对非MEMORY节点进行拓扑排序
 * 返回分层结果：[[第一层节点], [第二层节点], ...]
 * 同一层的节点互不依赖，可以并行计算
 */
export function topologicalSort(nodes: NodeDef[]): string[][] {
  const nodeMap = new Map<string, NodeDef>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 只处理非MEMORY节点
  const nonMemoryNodes = nodes.filter(n => n.gate !== 'MEMORY');
  const nonMemoryIds = new Set(nonMemoryNodes.map(n => n.id));

  // 计算入度（只计算对非MEMORY节点的依赖）
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // 谁依赖我

  for (const node of nonMemoryNodes) {
    inDegree.set(node.id, 0);
    dependents.set(node.id, []);
  }

  for (const node of nonMemoryNodes) {
    let degree = 0;
    for (const inputId of node.inputs) {
      if (nonMemoryIds.has(inputId)) {
        degree++;
        dependents.get(inputId)!.push(node.id);
      }
    }
    inDegree.set(node.id, degree);
  }

  // Kahn's Algorithm
  const layers: string[][] = [];
  const queue: string[] = [];

  // 找出入度为0的节点
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const layer: string[] = [];
    const nextQueue: string[] = [];

    // 处理当前层
    for (const nodeId of queue) {
      layer.push(nodeId);

      // 更新依赖此节点的节点的入度
      const deps = dependents.get(nodeId) || [];
      for (const depId of deps) {
        const newDegree = (inDegree.get(depId) || 1) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) {
          nextQueue.push(depId);
        }
      }
    }

    if (layer.length > 0) {
      layers.push(layer);
    }
    queue.length = 0;
    queue.push(...nextQueue);
  }

  return layers;
}

/**
 * 获取节点的计算层级
 * MEMORY节点返回 -1（特殊处理）
 */
export function getNodeLayer(
  layers: string[][],
  nodeId: string
): number {
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].includes(nodeId)) {
      return i;
    }
  }
  return -1; // MEMORY节点或不存在
}

/**
 * 获取所有节点的依赖深度
 */
export function getDependencyDepth(
  nodes: NodeDef[]
): Map<string, number> {
  const nodeMap = new Map<string, NodeDef>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const depth = new Map<string, number>();
  const nonMemoryNodes = nodes.filter(n => n.gate !== 'MEMORY');
  const nonMemoryIds = new Set(nonMemoryNodes.map(n => n.id));

  function computeDepth(nodeId: string): number {
    if (depth.has(nodeId)) {
      return depth.get(nodeId)!;
    }

    const node = nodeMap.get(nodeId);
    if (!node || node.gate === 'MEMORY') {
      depth.set(nodeId, 0);
      return 0;
    }

    let maxInputDepth = 0;
    for (const inputId of node.inputs) {
      if (nonMemoryIds.has(inputId)) {
        maxInputDepth = Math.max(maxInputDepth, computeDepth(inputId));
      }
    }

    const d = maxInputDepth + 1;
    depth.set(nodeId, d);
    return d;
  }

  for (const node of nonMemoryNodes) {
    computeDepth(node.id);
  }

  return depth;
}
