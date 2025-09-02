import { MultiTickerPortfolioState } from '../../src/domain/portfolio/multi-ticker-portfolio-state.js';
import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities.js';
import { TaxCalculator } from '../../src/domain/tax/tax-calculator.js';
import { InsufficientStockError } from '../../src/domain/errors.js';

describe('MultiTickerPortfolioState', () => {
  let portfolio;
  let taxPolicy;
  let taxCalc;

  beforeEach(() => {
    portfolio = new MultiTickerPortfolioState();
    taxPolicy = new BrazilEquities20pct();
    taxCalc = new TaxCalculator(taxPolicy);
  });

  describe('applyBuy', () => {
    it('should create new position for first buy', () => {
      portfolio.applyBuy('AAPL', 1000, 100); // $10.00 x 100

      const position = portfolio.getPosition('AAPL');
      expect(position.quantity).toBe(100);
      expect(position.avgPriceCents).toBe(1000);
    });

    it('should update weighted average for additional buys', () => {
      portfolio.applyBuy('AAPL', 1000, 100); // $10.00 x 100
      portfolio.applyBuy('AAPL', 1200, 50);  // $12.00 x 50

      const position = portfolio.getPosition('AAPL');
      expect(position.quantity).toBe(150);
      expect(position.avgPriceCents).toBe(1067); // weighted average
    });

    it('should handle multiple independent tickers', () => {
      portfolio.applyBuy('AAPL', 1000, 100);
      portfolio.applyBuy('MANU', 1500, 200);

      const applePosition = portfolio.getPosition('AAPL');
      const manuPosition = portfolio.getPosition('MANU');

      expect(applePosition.quantity).toBe(100);
      expect(applePosition.avgPriceCents).toBe(1000);
      expect(manuPosition.quantity).toBe(200);
      expect(manuPosition.avgPriceCents).toBe(1500);
    });

    it('should normalize ticker names (trim spaces)', () => {
      portfolio.applyBuy(' AAPL ', 1000, 100);

      const position = portfolio.getPosition('AAPL');
      expect(position.quantity).toBe(100);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => portfolio.applyBuy('', 1000, 100)).toThrow('ticker inválido');
      expect(() => portfolio.applyBuy('AAPL', -100, 100)).toThrow('unitPriceCents inválido');
      expect(() => portfolio.applyBuy('AAPL', 1000, 0)).toThrow('quantity inválida');
    });
  });

  describe('applySell', () => {
    beforeEach(() => {
      portfolio.applyBuy('AAPL', 1000, 1000); // $10.00 x 1000
      portfolio.applyBuy('MANU', 1500, 1000); // $15.00 x 1000
    });

    it('should process profitable sell with tax for large operations', () => {
      // Sell AAPL at profit: $30.00 x 1000 = $30,000 (> $20k threshold)
      const taxCents = portfolio.applySell('AAPL', 3000, 1000, taxCalc);

      expect(taxCents).toBe(400000); // 20% of $20,000 profit = $4,000
      expect(portfolio.getPosition('AAPL').quantity).toBe(0);
      expect(portfolio.accLossCents).toBe(0);
    });

    it('should be tax-free for operations under exemption threshold', () => {
      // Sell small amount: $30.00 x 100 = $3,000 (< $20k threshold)
      const taxCents = portfolio.applySell('AAPL', 3000, 100, taxCalc);

      expect(taxCents).toBe(0);
      expect(portfolio.getPosition('AAPL').quantity).toBe(900);
      expect(portfolio.accLossCents).toBe(0);
    });

    it('should accumulate losses globally for cross-ticker compensation', () => {
      // First sell AAPL at loss: $5.00 x 1000 = $5,000 (loss of $5,000)
      let taxCents = portfolio.applySell('AAPL', 500, 1000, taxCalc);
      expect(taxCents).toBe(0);
      expect(portfolio.accLossCents).toBe(500000); // $5,000 loss accumulated

      // Then sell MANU at profit but loss should offset
      // $30.00 x 1000 = $30,000, profit = $15,000, tax on $10,000 after offset
      taxCents = portfolio.applySell('MANU', 3000, 1000, taxCalc);
      expect(taxCents).toBe(200000); // 20% of $10,000 = $2,000
      expect(portfolio.accLossCents).toBe(0); // Loss consumed
    });

    it('should throw error when selling more than owned', () => {
      expect(() => {
        portfolio.applySell('AAPL', 1500, 1500, taxCalc); // Try to sell 1500 when only 1000 owned
      }).toThrow(InsufficientStockError);
    });

    it('should throw error when selling non-existent ticker', () => {
      expect(() => {
        portfolio.applySell('GOOGL', 1500, 100, taxCalc);
      }).toThrow(InsufficientStockError);
    });

    it('should remove position when all shares are sold', () => {
      portfolio.applySell('AAPL', 500, 1000, taxCalc); // Sell all AAPL shares

      expect(portfolio.getPosition('AAPL').quantity).toBe(0);
      expect(portfolio.getTickers()).not.toContain('AAPL');
    });

    it('should maintain average price after partial sell', () => {
      const originalAvg = portfolio.getPosition('AAPL').avgPriceCents;
      portfolio.applySell('AAPL', 1500, 500, taxCalc); // Sell half

      const position = portfolio.getPosition('AAPL');
      expect(position.quantity).toBe(500);
      expect(position.avgPriceCents).toBe(originalAvg); // Average unchanged
    });
  });

  describe('cross-ticker loss compensation examples', () => {
    it('should handle Example #1: Loss on AAPL, profit on MANU', () => {
      // Buy AAPL at 10, MANU at 15
      portfolio.applyBuy('AAPL', 1000, 10000);
      portfolio.applyBuy('MANU', 1500, 10000);

      // Sell AAPL at 5 (loss)
      let tax = portfolio.applySell('AAPL', 500, 10000, taxCalc);
      expect(tax).toBe(0); // No tax on loss
      expect(portfolio.accLossCents).toBe(5000000); // $50,000 loss

      // Sell MANU at 30 (profit of $150,000, but $50,000 loss offset)
      tax = portfolio.applySell('MANU', 3000, 10000, taxCalc);
      expect(tax).toBe(2000000); // 20% of $100,000 = $20,000
    });

    it('should handle Example #2: Equal loss/profit cancellation', () => {
      // Buy both at 10
      portfolio.applyBuy('AAPL', 1000, 10000);
      portfolio.applyBuy('MANU', 1000, 10000);

      // Sell AAPL at 5 (loss of $50,000)
      let tax = portfolio.applySell('AAPL', 500, 10000, taxCalc);
      expect(tax).toBe(0);
      expect(portfolio.accLossCents).toBe(5000000);

      // Sell MANU at 30 (profit of $200,000, $50,000 loss offset)
      tax = portfolio.applySell('MANU', 3000, 10000, taxCalc);
      expect(tax).toBe(3000000); // 20% of $150,000 = $30,000
    });

    it('should handle Example #3: Profit first, then loss', () => {
      // Buy AAPL at 10, MANU at 15
      portfolio.applyBuy('AAPL', 1000, 10000);
      portfolio.applyBuy('MANU', 1500, 10000);

      // Sell MANU at 30 first (profit of $150,000)
      let tax = portfolio.applySell('MANU', 3000, 10000, taxCalc);
      expect(tax).toBe(3000000); // 20% of $150,000 = $30,000

      // Sell AAPL at 5 (loss doesn't affect previous tax)
      tax = portfolio.applySell('AAPL', 500, 10000, taxCalc);
      expect(tax).toBe(0);
      expect(portfolio.accLossCents).toBe(5000000); // Loss accumulated for future
    });
  });

  describe('utility methods', () => {
    it('should return empty position for non-existent ticker', () => {
      const position = portfolio.getPosition('NON_EXISTENT');
      expect(position.quantity).toBe(0);
      expect(position.avgPriceCents).toBe(0);
    });

    it('should return list of active tickers', () => {
      portfolio.applyBuy('AAPL', 1000, 100);
      portfolio.applyBuy('MANU', 1500, 200);

      const tickers = portfolio.getTickers();
      expect(tickers).toContain('AAPL');
      expect(tickers).toContain('MANU');
      expect(tickers).toHaveLength(2);
    });

    it('should remove ticker from list when position reaches zero', () => {
      portfolio.applyBuy('AAPL', 1000, 100);
      portfolio.applySell('AAPL', 500, 100, taxCalc);

      const tickers = portfolio.getTickers();
      expect(tickers).not.toContain('AAPL');
    });
  });
});