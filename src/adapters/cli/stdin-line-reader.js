import { createInterface } from 'node:readline';
import { LineReaderPort } from '../../ports/line-reader.js';

export class StdinLineReader extends LineReaderPort {
  lines() {
    const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
    return rl;
  }
}
