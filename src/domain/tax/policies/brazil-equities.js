export class BrazilEquities20pct {
  constructor() {
    this.EXEMPT_THRESHOLD_CENTS = 2_000_000; // R$ 20.000,00
    this.RATE_NUM = 20; // 20%
    this.RATE_DEN = 100;
  }

  apply({ grossCents, sellTotalCents, accLossCents }) {
    if (grossCents <= 0) {
      const nextAccLossCents = accLossCents + Math.abs(grossCents);
      return { taxCents: 0, nextAccLossCents };
    }

    if (sellTotalCents <= this.EXEMPT_THRESHOLD_CENTS) {
      return { taxCents: 0, nextAccLossCents: accLossCents };
    }

    let taxableProfit = grossCents - accLossCents;
    let nextAccLossCents = 0;

    if (taxableProfit <= 0) {
      nextAccLossCents = Math.abs(taxableProfit);
      return { taxCents: 0, nextAccLossCents };
    }

    const taxCents = Math.round(
      (taxableProfit * this.RATE_NUM) / this.RATE_DEN
    );
    nextAccLossCents = 0;

    return { taxCents, nextAccLossCents };
  }
}
