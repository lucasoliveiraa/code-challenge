import { BrazilEquities20pct } from '../../src/domain/tax/policies/brazil-equities.js';

describe('BrazilEquities20pct policy', () => {
  test('prejuízo acumula e taxa 0', () => {
    const policy = new BrazilEquities20pct();
    const { taxCents, nextAccLossCents } = policy.apply({
      grossCents: -2000,
      sellTotalCents: 100000,
      accLossCents: 500
    });
    expect(taxCents).toBe(0);
    expect(nextAccLossCents).toBe(2500);
  });

  test('lucro isento não consome prejuízo', () => {
    const policy = new BrazilEquities20pct();
    const { taxCents, nextAccLossCents } = policy.apply({
      grossCents: 100000,
      sellTotalCents: 2_000_000,
      accLossCents: 30000
    });
    expect(taxCents).toBe(0);
    expect(nextAccLossCents).toBe(30000);
  });

  test('lucro tributável consome prejuízo e taxa 20%', () => {
    const policy = new BrazilEquities20pct();
    const { taxCents, nextAccLossCents } = policy.apply({
      grossCents: 500000,
      sellTotalCents: 2_500_000,
      accLossCents: 150000
    });
    expect(taxCents).toBe(70000);
    expect(nextAccLossCents).toBe(0);
  });

  test('prejuízo acumulado excede lucro tributável', () => {
    const policy = new BrazilEquities20pct();
    const { taxCents, nextAccLossCents } = policy.apply({
      grossCents: 100000, // R$ 1.000 lucro
      sellTotalCents: 2_500_000, // > 20k, tributável
      accLossCents: 150000 // R$ 1.500 prejuízo acumulado
    });
    expect(taxCents).toBe(0); // sem imposto
    expect(nextAccLossCents).toBe(50000); // mantém R$ 500 de prejuízo
  });
});
