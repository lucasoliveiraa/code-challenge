import { LineWriterPort } from '../../ports/line-writer.js';

export class StdoutLineWriter extends LineWriterPort {
  writeJsonLine(data) {
    console.log(JSON.stringify(data));
  }
}
