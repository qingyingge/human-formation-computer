import { GateType } from './types';

/**
 * 逻辑门求值
 * @param gate 逻辑门类型
 * @param inputs 输入值列表
 * @returns 输出值 0 或 1
 */
export function evaluateGate(gate: GateType, inputs: (0 | 1)[]): 0 | 1 {
  // 过滤掉 undefined，当作 0 处理
  const validInputs = inputs.map(x => x ?? 0);

  switch (gate) {
    case 'INPUT':
      // 输入节点：直接返回输入值
      return validInputs[0] ?? 0;

    case 'AND':
      // 与门：所有输入为1才输出1
      return validInputs.every(x => x === 1) ? 1 : 0;

    case 'OR':
      // 或门：任意输入为1就输出1
      return validInputs.some(x => x === 1) ? 1 : 0;

    case 'NOT':
      // 非门：输入取反
      return validInputs[0] === 1 ? 0 : 1;

    case 'XOR':
      // 异或门：奇数个输入为1则输出1
      return validInputs.filter(x => x === 1).length % 2 === 1 ? 1 : 0;

    case 'NAND':
      // 与非门：与门取反
      return validInputs.every(x => x === 1) ? 0 : 1;

    case 'NOR':
      // 或非门：或门取反
      return validInputs.some(x => x === 1) ? 0 : 1;

    case 'BUF':
      // 缓冲器：输出等于输入
      return validInputs[0] ?? 0;

    case 'MEMORY':
      // 存储器不在这里处理，由引擎单独处理
      return validInputs[0] ?? 0;

    default:
      return 0;
  }
}

/**
 * 计算逻辑门的真值表（用于测试和调试）
 */
export function getTruthTable(gate: GateType): string {
  const tables: Record<GateType, string> = {
    'INPUT': 'A | Q\n0 | 0\n1 | 1',
    'AND':   'A B | Q\n0 0 | 0\n0 1 | 0\n1 0 | 0\n1 1 | 1',
    'OR':    'A B | Q\n0 0 | 0\n0 1 | 1\n1 0 | 1\n1 1 | 1',
    'NOT':   'A | Q\n0 | 1\n1 | 0',
    'XOR':   'A B | Q\n0 0 | 0\n0 1 | 1\n1 0 | 1\n1 1 | 0',
    'NAND':  'A B | Q\n0 0 | 1\n0 1 | 1\n1 0 | 1\n1 1 | 0',
    'NOR':   'A B | Q\n0 0 | 1\n0 1 | 0\n1 0 | 0\n1 1 | 0',
    'BUF':   'A | Q\n0 | 0\n1 | 1',
    'MEMORY': '由引擎单独处理',
  };
  return tables[gate] || '未知门类型';
}
