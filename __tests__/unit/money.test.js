import {
  fromCents,
  roundToCents,
  toCents,
  totalFromUnit,
  weightedAverageCents,
  addCents,
  subCents
} from '../../src/domain/money.js';

describe('money helpers', () => {
  test('toCents aceita vírgula/ponto', () => {
    expect(toCents('10,01')).toBe(1001);
    expect(toCents('10.01')).toBe(1001);
  });

  test('roundToCents arredonda corretamente', () => {
    expect(roundToCents(16.6666)).toBe(1667);
  });

  test('fromCents: 1234 -> 12.34', () => {
    expect(fromCents(1234)).toBe(12.34);
  });

  test('totalFromUnit: 1067 * 150 -> 160050', () => {
    expect(totalFromUnit(1067, 150)).toBe(160050);
  });

  test('weightedAverageCents', () => {
    expect(weightedAverageCents(100, 1000, 50, 1200)).toBe(1067);
  });

  // Error/validation tests
  describe('toCents error handling', () => {
    test('rejeita tipos não suportados', () => {
      expect(() => toCents(null)).toThrow(
        'Valor monetário inválido: tipo não suportado'
      );
      expect(() => toCents(undefined)).toThrow(
        'Valor monetário inválido: tipo não suportado'
      );
      expect(() => toCents({})).toThrow(
        'Valor monetário inválido: tipo não suportado'
      );
    });

    test('rejeita valores não finitos', () => {
      expect(() => toCents(Infinity)).toThrow(
        'Valor monetário inválido: não finito'
      );
      expect(() => toCents(NaN)).toThrow(
        'Valor monetário inválido: não finito'
      );
      expect(() => toCents('invalid')).toThrow(
        'Valor monetário inválido: não finito'
      );
    });
  });

  describe('roundToCents error handling', () => {
    test('rejeita valores não finitos', () => {
      expect(() => roundToCents(Infinity)).toThrow('Valor não finito');
      expect(() => roundToCents(NaN)).toThrow('Valor não finito');
    });
  });

  describe('fromCents error handling', () => {
    test('rejeita valores não inteiros', () => {
      expect(() => fromCents(12.34)).toThrow('Centavos deve ser inteiro');
      expect(() => fromCents('1000')).toThrow('Centavos deve ser inteiro');
    });
  });

  describe('totalFromUnit error handling', () => {
    test('rejeita unitCents não inteiro', () => {
      expect(() => totalFromUnit(12.34, 100)).toThrow(
        'unitCents deve ser inteiro'
      );
    });

    test('rejeita quantity inválida', () => {
      expect(() => totalFromUnit(1000, 12.34)).toThrow('quantity inválida');
      expect(() => totalFromUnit(1000, -5)).toThrow('quantity inválida');
    });

    test('detecta overflow', () => {
      expect(() => totalFromUnit(Number.MAX_SAFE_INTEGER, 2)).toThrow(
        'Overflow em multiplicação de centavos'
      );
    });
  });

  describe('weightedAverageCents error handling', () => {
    test('rejeita q1 inválido', () => {
      expect(() => weightedAverageCents(12.34, 1000, 50, 1200)).toThrow(
        'q1 inválido'
      );
      expect(() => weightedAverageCents(-1, 1000, 50, 1200)).toThrow(
        'q1 inválido'
      );
    });

    test('rejeita q2 inválido', () => {
      expect(() => weightedAverageCents(100, 1000, 0, 1200)).toThrow(
        'q2 inválido'
      );
      expect(() => weightedAverageCents(100, 1000, -1, 1200)).toThrow(
        'q2 inválido'
      );
    });

    test('rejeita avg1Cents inválido', () => {
      expect(() => weightedAverageCents(100, 12.34, 50, 1200)).toThrow(
        'avg1Cents inválido'
      );
      expect(() => weightedAverageCents(100, -1, 50, 1200)).toThrow(
        'avg1Cents inválido'
      );
    });

    test('rejeita price2Cents inválido', () => {
      expect(() => weightedAverageCents(100, 1000, 50, 12.34)).toThrow(
        'price2Cents inválido'
      );
      expect(() => weightedAverageCents(100, 1000, 50, -1)).toThrow(
        'price2Cents inválido'
      );
    });

    test('detecta overflow no cálculo', () => {
      expect(() =>
        weightedAverageCents(
          Number.MAX_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          1,
          1000
        )
      ).toThrow('Overflow no cálculo da média');
    });
  });

  describe('addCents error handling', () => {
    test('rejeita parâmetros não inteiros', () => {
      expect(() => addCents(12.34, 100)).toThrow(
        'Parâmetros devem ser inteiros'
      );
      expect(() => addCents(100, 56.78)).toThrow(
        'Parâmetros devem ser inteiros'
      );
    });

    test('detecta overflow', () => {
      expect(() => addCents(Number.MAX_SAFE_INTEGER, 1)).toThrow(
        'Overflow em soma de centavos'
      );
    });

    test('soma corretamente', () => {
      expect(addCents(1000, 500)).toBe(1500);
    });
  });

  describe('subCents error handling', () => {
    test('rejeita parâmetros não inteiros', () => {
      expect(() => subCents(12.34, 100)).toThrow(
        'Parâmetros devem ser inteiros'
      );
      expect(() => subCents(100, 56.78)).toThrow(
        'Parâmetros devem ser inteiros'
      );
    });

    test('detecta overflow', () => {
      expect(() => subCents(Number.MIN_SAFE_INTEGER, 1)).toThrow(
        'Overflow em subtração de centavos'
      );
    });

    test('subtrai corretamente', () => {
      expect(subCents(1000, 300)).toBe(700);
    });
  });
});
