const EPS = 1e-8;

export function toCents(value) {
  let num;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    num = Number(normalized);
  } else {
    throw new Error('Valor monetário inválido: tipo não suportado');
  }
  if (!Number.isFinite(num))
    throw new Error('Valor monetário inválido: não finito');
  return Math.round((num + Math.sign(num) * EPS) * 100);
}

export function roundToCents(valueReais) {
  if (!Number.isFinite(valueReais)) throw new Error('Valor não finito');
  return Math.round((valueReais + Math.sign(valueReais) * EPS) * 100);
}

export function fromCents(cents) {
  if (!Number.isInteger(cents)) throw new Error('Centavos deve ser inteiro');
  return Number((cents / 100).toFixed(2));
}

export function totalFromUnit(unitCents, quantity) {
  if (!Number.isInteger(unitCents))
    throw new Error('unitCents deve ser inteiro');
  if (!Number.isInteger(quantity) || quantity < 0)
    throw new Error('quantity inválida');
  const total = unitCents * quantity;
  if (!Number.isSafeInteger(total))
    throw new Error('Overflow em multiplicação de centavos');
  return total;
}

export function weightedAverageCents(q1, avg1Cents, q2, price2Cents) {
  if (!Number.isInteger(q1) || q1 < 0) throw new Error('q1 inválido');
  if (!Number.isInteger(q2) || q2 <= 0) throw new Error('q2 inválido');
  if (!Number.isInteger(avg1Cents) || avg1Cents < 0)
    throw new Error('avg1Cents inválido');
  if (!Number.isInteger(price2Cents) || price2Cents < 0)
    throw new Error('price2Cents inválido');
  const totalQty = q1 + q2;
  const numerator = q1 * avg1Cents + q2 * price2Cents;
  if (!Number.isSafeInteger(numerator))
    throw new Error('Overflow no cálculo da média');
  const avg = numerator / totalQty;
  return Math.round(avg);
}

export function addCents(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b))
    throw new Error('Parâmetros devem ser inteiros');
  const s = a + b;
  if (!Number.isSafeInteger(s)) throw new Error('Overflow em soma de centavos');
  return s;
}

export function subCents(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b))
    throw new Error('Parâmetros devem ser inteiros');
  const s = a - b;
  if (!Number.isSafeInteger(s))
    throw new Error('Overflow em subtração de centavos');
  return s;
}
