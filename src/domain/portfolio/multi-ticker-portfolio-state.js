import { InsufficientStockError } from '../errors.js';
import { totalFromUnit, weightedAverageCents } from '../money.js';

export class MultiTickerPortfolioState {
  constructor() {
    this.positions = new Map(); // ticker -> { quantity, avgPriceCents }
    this.accLossCents = 0; // Global loss accumulation for cross-ticker compensation
  }

  applyBuy(ticker, unitPriceCents, qty) {
    console.log('aqui --->', ticker);
    if (typeof ticker !== 'string' || ticker.trim() === '') {
      throw new Error('applyBuy: ticker inválido');
    }
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new Error('applyBuy: unitPriceCents inválido');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('applyBuy: quantity inválida');
    }

    const normalizedTicker = ticker.trim();
    const position = this.positions.get(normalizedTicker) || { quantity: 0, avgPriceCents: 0 };

    const newAvgPriceCents = weightedAverageCents(
      position.quantity,
      position.avgPriceCents,
      qty,
      unitPriceCents
    );

    this.positions.set(normalizedTicker, {
      quantity: position.quantity + qty,
      avgPriceCents: newAvgPriceCents
    });
  }

  applySell(ticker, unitPriceCents, qty, taxCalc) {
    if (typeof ticker !== 'string' || ticker.trim() === '') {
      throw new Error('applySell: ticker inválido');
    }
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new Error('applySell: unitPriceCents inválido');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('applySell: quantity inválida');
    }

    const normalizedTicker = ticker.trim();
    const position = this.positions.get(normalizedTicker);

    if (!position || qty > position.quantity) {
      throw new InsufficientStockError();
    }

    const sellTotalCents = totalFromUnit(unitPriceCents, qty);
    const costBasisCents = totalFromUnit(position.avgPriceCents, qty);
    const grossCents = sellTotalCents - costBasisCents;

    const { taxCents, nextAccLossCents } = taxCalc.compute({
      grossCents,
      sellTotalCents,
      accLossCents: this.accLossCents
    });

    if (!Number.isInteger(taxCents) || taxCents < 0) {
      throw new Error('TaxCalculator retornou taxCents inválido');
    }
    if (!Number.isInteger(nextAccLossCents) || nextAccLossCents < 0) {
      throw new Error('TaxCalculator retornou accLoss inválido');
    }

    // Update global loss accumulation (cross-ticker compensation)
    this.accLossCents = nextAccLossCents;

    // Update ticker position
    const newQuantity = position.quantity - qty;
    if (newQuantity === 0) {
      this.positions.delete(normalizedTicker);
    } else {
      this.positions.set(normalizedTicker, {
        quantity: newQuantity,
        avgPriceCents: position.avgPriceCents // Average doesn't change on sells
      });
    }

    return taxCents;
  }

  getPosition(ticker) {
    const normalizedTicker = ticker.trim();
    return this.positions.get(normalizedTicker) || { quantity: 0, avgPriceCents: 0 };
  }

  getTickers() {
    return Array.from(this.positions.keys());
  }
}
