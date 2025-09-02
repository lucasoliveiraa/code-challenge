import { toCents } from './money.js';

export function parseOperations(raw) {
  if (!Array.isArray(raw)) throw new Error('Input deve ser um array de operações');

  const result = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== 'object' || item == null) {
      throw new Error(`Operação #${i + 1} inválida: não é um objeto`);
    }

    let { operation } = item;
    if (typeof operation !== 'string') {
      throw new Error(`Operação #${i + 1}: campo "operation" ausente ou inválido`);
    }
    const kind = operation.toLowerCase();
    if (kind !== 'buy' && kind !== 'sell') {
      throw new Error(`Operação #${i + 1}: tipo desconhecido "${operation}"`);
    }

    let unitCost = item['unit-cost'];
    if (unitCost == null) unitCost = item['unitCost'];
    if (unitCost == null) {
      throw new Error(`Operação #${i + 1}: campo unit-cost/unitCost ausente`);
    }
    const unitCents = toCents(unitCost);
    if (unitCents < 0) throw new Error(`Operação #${i + 1}: unit-cost negativo`);

    const quantity = item['quantity'];
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Operação #${i + 1}: quantity inválida`);
    }

    const ticker = item['ticker'];
    if (ticker != null) {
      if (typeof ticker !== 'string' || ticker.trim() === '') {
        throw new Error(`Operação #${i + 1}: campo ticker inválido`);
      }
      result.push({ kind, unitCents, qty: quantity, ticker: ticker.trim() });
    } else {
      // For backward compatibility, default to 'DEFAULT' ticker
      result.push({ kind, unitCents, qty: quantity, ticker: 'DEFAULT' });
    }
  }

  return result;
}
