import { parseOperations } from '../../src/domain/operations.js';

describe('parseOperations with ticker support', () => {
  it('should parse operations with ticker field', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10.00, quantity: 100, ticker: 'AAPL' },
      { operation: 'sell', 'unit-cost': 12.00, quantity: 50, ticker: 'AAPL' }
    ];

    const result = parseOperations(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      kind: 'buy',
      unitCents: 1000,
      qty: 100,
      ticker: 'AAPL'
    });
    expect(result[1]).toEqual({
      kind: 'sell',
      unitCents: 1200,
      qty: 50,
      ticker: 'AAPL'
    });
  });

  it('should handle unitCost alternative format with ticker', () => {
    const input = [
      { operation: 'buy', unitCost: 15.50, quantity: 200, ticker: 'MANU' }
    ];

    const result = parseOperations(input);

    expect(result[0]).toEqual({
      kind: 'buy',
      unitCents: 1550,
      qty: 200,
      ticker: 'MANU'
    });
  });

  it('should trim whitespace from ticker names', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: '  AAPL  ' }
    ];

    const result = parseOperations(input);

    expect(result[0].ticker).toBe('AAPL');
  });

  it('should default to DEFAULT ticker when ticker is missing', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100 } // missing ticker
    ];

    const result = parseOperations(input);
    expect(result[0].ticker).toBe('DEFAULT');
  });

  it('should default to DEFAULT ticker when ticker is null', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: null }
    ];

    const result = parseOperations(input);
    expect(result[0].ticker).toBe('DEFAULT');
  });

  it('should throw error when ticker is empty string', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: '' }
    ];

    expect(() => parseOperations(input)).toThrow('campo ticker inválido');
  });

  it('should throw error when ticker is only whitespace', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: '   ' }
    ];

    expect(() => parseOperations(input)).toThrow('campo ticker inválido');
  });

  it('should throw error when ticker is not a string', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: 123 }
    ];

    expect(() => parseOperations(input)).toThrow('campo ticker inválido');
  });

  it('should handle mixed ticker operations correctly', () => {
    const input = [
      { operation: 'buy', 'unit-cost': 10, quantity: 100, ticker: 'AAPL' },
      { operation: 'buy', 'unit-cost': 15, quantity: 200, ticker: 'MANU' },
      { operation: 'sell', 'unit-cost': 12, quantity: 50, ticker: 'AAPL' },
      { operation: 'sell', 'unit-cost': 20, quantity: 100, ticker: 'MANU' }
    ];

    const result = parseOperations(input);

    expect(result).toHaveLength(4);
    expect(result.map(op => op.ticker)).toEqual(['AAPL', 'MANU', 'AAPL', 'MANU']);
    expect(result.map(op => op.kind)).toEqual(['buy', 'buy', 'sell', 'sell']);
  });
});