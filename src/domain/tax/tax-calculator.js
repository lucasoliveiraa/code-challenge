export class TaxCalculator {
  constructor(policy) {
    this.policy = policy;
  }

  compute(input) {
    const { grossCents, sellTotalCents, accLossCents } = input ?? {};
    if (!Number.isInteger(grossCents)) throw new Error('grossCents inválido');
    if (!Number.isInteger(sellTotalCents) || sellTotalCents < 0)
      throw new Error('sellTotalCents inválido');
    if (!Number.isInteger(accLossCents) || accLossCents < 0)
      throw new Error('accLossCents inválido');

    const res = this.policy.apply({ grossCents, sellTotalCents, accLossCents });
    if (
      !res ||
      !Number.isInteger(res.taxCents) ||
      !Number.isInteger(res.nextAccLossCents)
    ) {
      throw new Error('Policy retornou resultado inválido');
    }
    return res;
  }
}
