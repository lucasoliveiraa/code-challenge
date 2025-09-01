import { InsufficientStockError } from '../../src/domain/errors.js';
import { PortfolioState } from '../../src/domain/portfolio/portfolio-state.js';
import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities.js';
import { TaxCalculator } from '../../src/domain/tax/tax-calculator.js';

describe('PortfolioState', () => {
  test('applyBuy atualiza média e quantidade', () => {
    const s = new PortfolioState();
    s.applyBuy(1000, 100); // R$10,00 x100
    expect(s.avgPriceCents).toBe(1000);
    expect(s.quantity).toBe(100);
    s.applyBuy(1200, 50); // R$12,00 x50 => média 10.67
    expect(s.avgPriceCents).toBe(1067);
    expect(s.quantity).toBe(150);
  });

  test('venda isenta não consome prejuízo', () => {
    const s = new PortfolioState();
    const taxCalc = new TaxCalculator(new BrazilEquities20pct());
    s.applyBuy(1000, 100);
    s.applyBuy(1200, 50);
    // cria prejuízo: 50 @ R$5 (<= 20k)
    let tax = s.applySell(500, 50, taxCalc);
    expect(tax).toBe(0);
    const prevLoss = s.accLossCents; // > 0
    // venda com lucro mas total <= 20k (150-50=100; 100 * 2000 = 200k = R$2.000)
    tax = s.applySell(2000, s.quantity, taxCalc);
    expect(tax).toBe(0);
    expect(s.accLossCents).toBe(prevLoss);
  });

  test('venda tributável consome prejuízo e taxa 20%', () => {
    const s = new PortfolioState();
    const taxCalc = new TaxCalculator(new BrazilEquities20pct());
    s.applyBuy(1000, 2000);
    // prejuízo: 1000 @ R$5 (<= 20k)
    let tax = s.applySell(500, 1000, taxCalc);
    expect(tax).toBe(0);
    expect(s.accLossCents).toBe(1000 * (1000 - 500)); // 500.000
    // tributável: 1000 @ R$30 (> 20k)
    tax = s.applySell(3000, 1000, taxCalc);
    expect(tax).toBe(300000);
    expect(s.accLossCents).toBe(0);
    expect(s.quantity).toBe(0);
  });

  // Validation/error tests
  describe('applyBuy validation', () => {
    test('rejeita unitPriceCents inválido', () => {
      const s = new PortfolioState();
      expect(() => s.applyBuy(12.34, 100)).toThrow(
        'applyBuy: unitPriceCents inválido'
      );
      expect(() => s.applyBuy(-100, 100)).toThrow(
        'applyBuy: unitPriceCents inválido'
      );
    });

    test('rejeita quantity inválida', () => {
      const s = new PortfolioState();
      expect(() => s.applyBuy(1000, 12.34)).toThrow(
        'applyBuy: quantity inválida'
      );
      expect(() => s.applyBuy(1000, 0)).toThrow('applyBuy: quantity inválida');
      expect(() => s.applyBuy(1000, -5)).toThrow('applyBuy: quantity inválida');
    });
  });

  describe('applySell validation', () => {
    test('rejeita unitPriceCents inválido', () => {
      const s = new PortfolioState();
      const taxCalc = new TaxCalculator(new BrazilEquities20pct());
      s.applyBuy(1000, 100);
      expect(() => s.applySell(12.34, 50, taxCalc)).toThrow(
        'applySell: unitPriceCents inválido'
      );
      expect(() => s.applySell(-100, 50, taxCalc)).toThrow(
        'applySell: unitPriceCents inválido'
      );
    });

    test('rejeita quantity inválida', () => {
      const s = new PortfolioState();
      const taxCalc = new TaxCalculator(new BrazilEquities20pct());
      s.applyBuy(1000, 100);
      expect(() => s.applySell(1000, 12.34, taxCalc)).toThrow(
        'applySell: quantity inválida'
      );
      expect(() => s.applySell(1000, 0, taxCalc)).toThrow(
        'applySell: quantity inválida'
      );
      expect(() => s.applySell(1000, -5, taxCalc)).toThrow(
        'applySell: quantity inválida'
      );
    });

    test('rejeita venda acima do estoque', () => {
      const s = new PortfolioState();
      const taxCalc = new TaxCalculator(new BrazilEquities20pct());
      s.applyBuy(1000, 100);
      expect(() => s.applySell(1000, 150, taxCalc)).toThrow(
        InsufficientStockError
      );
    });

    test('valida retorno do TaxCalculator', () => {
      const s = new PortfolioState();
      s.applyBuy(1000, 100);

      // Mock taxCalc que retorna valores inválidos
      const badTaxCalc = {
        compute: () => ({ taxCents: 12.34, nextAccLossCents: 0 })
      };
      expect(() => s.applySell(1000, 50, badTaxCalc)).toThrow(
        'TaxCalculator retornou taxCents inválido'
      );

      const badTaxCalc2 = {
        compute: () => ({ taxCents: 0, nextAccLossCents: 12.34 })
      };
      expect(() => s.applySell(1000, 50, badTaxCalc2)).toThrow(
        'TaxCalculator retornou accLoss inválido'
      );

      const badTaxCalc3 = {
        compute: () => ({ taxCents: -100, nextAccLossCents: 0 })
      };
      expect(() => s.applySell(1000, 50, badTaxCalc3)).toThrow(
        'TaxCalculator retornou taxCents inválido'
      );
    });
  });
});
