import { TaxCalculator } from '../../src/domain/tax/tax-calculator.js';
import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities.js';

describe('TaxCalculator', () => {
  describe('compute validation', () => {
    const taxCalc = new TaxCalculator(new BrazilEquities20pct());

    test('trata input null/undefined', () => {
      expect(() => taxCalc.compute(null)).toThrow('grossCents inválido');
      expect(() => taxCalc.compute(undefined)).toThrow('grossCents inválido');
    });

    test('rejeita grossCents inválido', () => {
      expect(() =>
        taxCalc.compute({
          grossCents: 12.34,
          sellTotalCents: 100000,
          accLossCents: 0
        })
      ).toThrow('grossCents inválido');
    });

    test('rejeita sellTotalCents inválido', () => {
      expect(() =>
        taxCalc.compute({
          grossCents: 100000,
          sellTotalCents: 12.34,
          accLossCents: 0
        })
      ).toThrow('sellTotalCents inválido');

      expect(() =>
        taxCalc.compute({
          grossCents: 100000,
          sellTotalCents: -100,
          accLossCents: 0
        })
      ).toThrow('sellTotalCents inválido');
    });

    test('rejeita accLossCents inválido', () => {
      expect(() =>
        taxCalc.compute({
          grossCents: 100000,
          sellTotalCents: 100000,
          accLossCents: 12.34
        })
      ).toThrow('accLossCents inválido');

      expect(() =>
        taxCalc.compute({
          grossCents: 100000,
          sellTotalCents: 100000,
          accLossCents: -100
        })
      ).toThrow('accLossCents inválido');
    });

    test('valida resposta da política', () => {
      // Mock policy que retorna resposta inválida
      const badPolicy = {
        apply: () => null
      };
      const badTaxCalc = new TaxCalculator(badPolicy);

      expect(() =>
        badTaxCalc.compute({
          grossCents: 100000,
          sellTotalCents: 100000,
          accLossCents: 0
        })
      ).toThrow('Policy retornou resultado inválido');

      const badPolicy2 = {
        apply: () => ({ taxCents: 12.34, nextAccLossCents: 0 })
      };
      const badTaxCalc2 = new TaxCalculator(badPolicy2);

      expect(() =>
        badTaxCalc2.compute({
          grossCents: 100000,
          sellTotalCents: 100000,
          accLossCents: 0
        })
      ).toThrow('Policy retornou resultado inválido');

      const badPolicy3 = {
        apply: () => ({ taxCents: 0, nextAccLossCents: 12.34 })
      };
      const badTaxCalc3 = new TaxCalculator(badPolicy3);

      expect(() =>
        badTaxCalc3.compute({
          grossCents: 100000,
          sellTotalCents: 100000,
          accLossCents: 0
        })
      ).toThrow('Policy retornou resultado inválido');
    });

    test('computa corretamente com política válida', () => {
      const result = taxCalc.compute({
        grossCents: 100000,
        sellTotalCents: 2_500_000,
        accLossCents: 0
      });
      expect(result.taxCents).toBe(20000);
      expect(result.nextAccLossCents).toBe(0);
    });
  });
});
