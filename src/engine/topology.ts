import type { NodeDef } from './types';

export function topologicalSort(nodes: NodeDef[]): string[][] {
  const nodeMap = new Map<string, NodeDef>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const nonMemoryNodes = nodes.filter(n => n.gate !== 'MEMORY');
  const nonMemoryIds = new Set(nonMemoryNodes.map(n => n.id));

  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

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

  const layers: string[][] = [];
  const queue: string[] = [];

  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const layer: string[] = [];
    const nextQueue: string[] = [];

    for (const nodeId of queue) {
      layer.push(nodeId);
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

export function getNodeLayer(layers: string[][], nodeId: string): number {
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].includes(nodeId)) {
      return i;
    }
  }
  return -1;
}
