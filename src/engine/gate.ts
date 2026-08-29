import type { GateType } from './types';

export function evaluateGate(gate: GateType, inputs: (0 | 1)[]): 0 | 1 {
  const validInputs = inputs.map(x => x ?? 0);

  switch (gate) {
    case 'INPUT':
      return validInputs[0] ?? 0;
    case 'AND':
      return validInputs.every(x => x === 1) ? 1 : 0;
    case 'OR':
      return validInputs.some(x => x === 1) ? 1 : 0;
    case 'NOT':
      return validInputs[0] === 1 ? 0 : 1;
    case 'XOR':
      return validInputs.filter(x => x === 1).length % 2 === 1 ? 1 : 0;
    case 'NAND':
      return validInputs.every(x => x === 1) ? 0 : 1;
    case 'NOR':
      return validInputs.some(x => x === 1) ? 0 : 1;
    case 'BUF':
      return validInputs[0] ?? 0;
    case 'MEMORY':
      return validInputs[0] ?? 0;
    default:
      return 0;
  }
}
