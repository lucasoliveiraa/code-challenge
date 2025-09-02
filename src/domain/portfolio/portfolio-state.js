import { InsufficientStockError } from '../errors.js';
import { totalFromUnit, weightedAverageCents } from '../money.js';

export class PortfolioState {
  constructor() {
    this.quantity = 0;
    this.avgPriceCents = 0;
    this.accLossCents = 0;
  }

  applyBuy(unitPriceCents, qty) {
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new Error('applyBuy: unitPriceCents inválido');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('applyBuy: quantity inválida');
    }

    this.avgPriceCents = weightedAverageCents(
      this.quantity,
      this.avgPriceCents,
      qty,
      unitPriceCents
    );

    this.quantity += qty;
  }

  applySell(unitPriceCents, qty, taxCalc) {
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
      throw new Error('applySell: unitPriceCents inválido');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('applySell: quantity inválida');
    }
    if (qty > this.quantity) {
      throw new InsufficientStockError();
    }

    const sellTotalCents = totalFromUnit(unitPriceCents, qty);
    const costBasisCents = totalFromUnit(this.avgPriceCents, qty);
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

    this.accLossCents = nextAccLossCents;
    this.quantity -= qty;

    return taxCents;
  }
}
