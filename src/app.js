import { StdinLineReader } from './adapters/cli/stdin-line-reader.js';
import { StdoutLineWriter } from './adapters/cli/stdout-line-writer.js';
import { ConsoleLogger } from './adapters/logging/console-logger.js';
import { ProcessLineUseCase } from './application/process-line.usecase.js';
import { BrazilEquities20pct } from './domain/tax/policies/brazil-equities.js';

export async function run() {
  const reader = new StdinLineReader();
  const writer = new StdoutLineWriter();
  const logger = new ConsoleLogger();
  const taxPolicy = new BrazilEquities20pct();

  const usecase = new ProcessLineUseCase({ reader, writer, logger, taxPolicy });
  await usecase.execute();
}
