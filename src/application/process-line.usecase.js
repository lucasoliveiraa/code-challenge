import { fromCents } from '../domain/money.js';
import { parseOperations } from '../domain/operations.js';
import { PortfolioState } from '../domain/portfolio/portfolio-state.js';
import { TaxCalculator } from '../domain/tax/tax-calculator.js';

export class ProcessLineUseCase {
  constructor({ reader, writer, logger, taxPolicy }) {
    this.reader = reader;
    this.writer = writer;
    this.logger = logger;
    this.taxPolicy = taxPolicy;
  }

  async execute() {
    const taxCalc = new TaxCalculator(this.taxPolicy);

    for await (const line of this.reader.lines()) {
      const trimmed = (line ?? '').trim();
      if (!trimmed) break;

      const payloads = splitJsonArrays(trimmed);

      for (const payload of payloads) {
        let ops;
        try {
          const arr = JSON.parse(payload);
          ops = parseOperations(arr);
        } catch (e) {
          this.logger.error(`Linha inválida: ${e.message}`);
          continue;
        }

        const state = new PortfolioState();
        const output = [];

        for (const op of ops) {
          if (op.kind === 'buy') {
            state.applyBuy(op.unitCents, op.qty);
            output.push({ tax: 0 });
          } else {
            const taxCents = state.applySell(op.unitCents, op.qty, taxCalc);
            output.push({ tax: fromCents(taxCents) });
          }
        }

        this.writer.writeJsonLine(output);
      }
    }
  }
}

function splitJsonArrays(line) {
  const chunks = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      if (depth === 0) {
        // strings fora de arrays não iniciam um bloco válido; ignoramos
      }
      continue;
    }

    if (ch === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        chunks.push(line.slice(start, i + 1));
        start = -1;
      }
    }
  }

  if (chunks.length === 0) return [line];
  return chunks;
}
