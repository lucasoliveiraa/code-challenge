import { InsufficientStockError } from '../../src/domain/errors.js';
import { PortfolioState } from '../../src/domain/portfolio/portfolio-state.js';
import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities.js';
import { TaxCalculator } from '../../src/domain/tax/tax-calculator.js';

describe('PortfolioState – insufficient stock', () => {
  test('sell above holdings throws InsufficientStockError and preserves state', () => {
    const s = new PortfolioState();
    s.applyBuy(1000, 100);
    const before = { qty: s.quantity, avg: s.avgPriceCents, loss: s.accLossCents };
    const taxCalc = new TaxCalculator(new BrazilEquities20pct());

    expect(() => s.applySell(2000, 110, taxCalc)).toThrow(InsufficientStockError);

    expect(s.quantity).toBe(before.qty);
    expect(s.avgPriceCents).toBe(before.avg);
    expect(s.accLossCents).toBe(before.loss);
  });
});
