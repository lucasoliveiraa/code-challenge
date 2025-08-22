import { parseOperations } from '../../src/domain/operations.js';

describe('parseOperations', () => {
  describe('validações básicas', () => {
    test('rejeita entrada não array', () => {
      expect(() => parseOperations(null)).toThrow(
        'Input deve ser um array de operações'
      );
      expect(() => parseOperations('string')).toThrow(
        'Input deve ser um array de operações'
      );
      expect(() => parseOperations({})).toThrow(
        'Input deve ser um array de operações'
      );
    });

    test('rejeita operação não objeto', () => {
      expect(() => parseOperations([null])).toThrow(
        'Operação #1 inválida: não é um objeto'
      );
      expect(() => parseOperations(['string'])).toThrow(
        'Operação #1 inválida: não é um objeto'
      );
      expect(() => parseOperations([123])).toThrow(
        'Operação #1 inválida: não é um objeto'
      );
    });

    test('rejeita operation ausente ou inválido', () => {
      expect(() => parseOperations([{}])).toThrow(
        'Operação #1: campo "operation" ausente ou inválido'
      );
      expect(() => parseOperations([{ operation: null }])).toThrow(
        'Operação #1: campo "operation" ausente ou inválido'
      );
      expect(() => parseOperations([{ operation: 123 }])).toThrow(
        'Operação #1: campo "operation" ausente ou inválido'
      );
    });

    test('rejeita operation desconhecido', () => {
      expect(() => parseOperations([{ operation: 'invalid' }])).toThrow(
        'Operação #1: tipo desconhecido "invalid"'
      );
      expect(() => parseOperations([{ operation: 'transfer' }])).toThrow(
        'Operação #1: tipo desconhecido "transfer"'
      );
    });

    test('rejeita unit-cost ausente', () => {
      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            quantity: 100
          }
        ])
      ).toThrow('Operação #1: campo unit-cost/unitCost ausente');
    });

    test('rejeita unit-cost negativo', () => {
      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            'unit-cost': -10.0,
            quantity: 100
          }
        ])
      ).toThrow('Operação #1: unit-cost negativo');
    });

    test('rejeita quantity inválida', () => {
      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            'unit-cost': 10.0
          }
        ])
      ).toThrow('Operação #1: quantity inválida');

      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            'unit-cost': 10.0,
            quantity: 0
          }
        ])
      ).toThrow('Operação #1: quantity inválida');

      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            'unit-cost': 10.0,
            quantity: -5
          }
        ])
      ).toThrow('Operação #1: quantity inválida');

      expect(() =>
        parseOperations([
          {
            operation: 'buy',
            'unit-cost': 10.0,
            quantity: 12.5
          }
        ])
      ).toThrow('Operação #1: quantity inválida');
    });
  });

  describe('parsing correto', () => {
    test('aceita formato unit-cost', () => {
      const result = parseOperations([
        {
          operation: 'buy',
          'unit-cost': 10.5,
          quantity: 100
        }
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        kind: 'buy',
        unitCents: 1050,
        qty: 100
      });
    });

    test('aceita formato unitCost', () => {
      const result = parseOperations([
        {
          operation: 'sell',
          unitCost: 15.75,
          quantity: 50
        }
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        kind: 'sell',
        unitCents: 1575,
        qty: 50
      });
    });

    test('normaliza operation para lowercase', () => {
      const result = parseOperations([
        { operation: 'BUY', 'unit-cost': 10.0, quantity: 100 },
        { operation: 'SELL', 'unit-cost': 15.0, quantity: 50 },
        { operation: 'Buy', 'unit-cost': 20.0, quantity: 25 }
      ]);
      expect(result[0].kind).toBe('buy');
      expect(result[1].kind).toBe('sell');
      expect(result[2].kind).toBe('buy');
    });

    test('processa múltiplas operações', () => {
      const result = parseOperations([
        { operation: 'buy', 'unit-cost': 10.0, quantity: 100 },
        { operation: 'sell', 'unit-cost': 15.0, quantity: 50 },
        { operation: 'sell', 'unit-cost': 15.0, quantity: 50 }
      ]);
      expect(result).toHaveLength(3);
      expect(result[0].kind).toBe('buy');
      expect(result[1].kind).toBe('sell');
      expect(result[2].kind).toBe('sell');
    });
  });

  describe('numeração de erros', () => {
    test('indica posição correta do erro', () => {
      expect(() =>
        parseOperations([
          { operation: 'buy', 'unit-cost': 10.0, quantity: 100 },
          { operation: 'invalid', 'unit-cost': 15.0, quantity: 50 },
          { operation: 'sell', 'unit-cost': 20.0, quantity: 25 }
        ])
      ).toThrow('Operação #2: tipo desconhecido "invalid"');

      expect(() =>
        parseOperations([
          { operation: 'buy', 'unit-cost': 10.0, quantity: 100 },
          { operation: 'sell', 'unit-cost': 15.0, quantity: 50 },
          { operation: 'sell', 'unit-cost': -20.0, quantity: 25 }
        ])
      ).toThrow('Operação #3: unit-cost negativo');
    });
  });
});
