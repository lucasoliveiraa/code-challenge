import { PortfolioState } from '../../src/domain/portfolio/portfolio-state';
import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities';
import { TaxCalculator } from '../../src/domain/tax/tax-calculator';

describe('Insufficient stock', () => {
  test('sell above holdings throws insufficient stock and preserves state', () => {
    const state = new PortfolioState();
    state.applyBuy(1000, 100);
    const before = { qty: state.quantity, avg: state.avgPriceCents, loss: state.accLossCents };
    const taxCalc = new TaxCalculator(new BrazilEquities20pct());

    expect(() => state.applySell(2000, 110, taxCalc)).toThrow(
      'Can\'t sell more stocks than you have'
    );
    expect(state.quantity).toBe(before.qty);
    expect(state.avgPriceCents).toBe(before.avg);
    expect(state.accLossCents).toBe(before.loss);
  });
});
