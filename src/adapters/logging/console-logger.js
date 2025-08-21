import { LoggerPort } from '../../ports/logger.js';

export class ConsoleLogger extends LoggerPort {
  info(msg) {
    console.info(msg);
  }
  error(msg) {
    console.error(msg);
  }
}
