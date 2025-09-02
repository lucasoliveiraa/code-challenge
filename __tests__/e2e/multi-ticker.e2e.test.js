import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_PATH = resolve(__dirname, '../../src/index.js');

function runCLIWithInput(input) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [APP_PATH], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Process exited with code ${code}. stdout: ${stdout}, stderr: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });

    // Send input and close stdin
    proc.stdin.write(input + '\n\n'); // Extra newline to terminate
    proc.stdin.end();
    
    // Add timeout to prevent hanging
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Process timed out. stdout: ${stdout}, stderr: ${stderr}`));
    }, 5000);
  });
}

describe('Multi-Ticker E2E Tests', () => {
  test('Example #1: Loss on AAPL, profit on MANU with different buy prices', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 10000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":15, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":5, "quantity": 10000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":30, "quantity": 10000, "ticker":"MANU"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},      // Buy AAPL
      {"tax": 0},      // Buy MANU
      {"tax": 0},      // Sell AAPL at loss ($50k loss accumulated)
      {"tax": 20000}   // Sell MANU at profit ($150k profit - $50k loss = $100k taxable)
    ]);
  });

  test('Example #2: Equal buy prices, loss offsets profit exactly', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 10000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":10, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":5, "quantity": 10000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":30, "quantity": 10000, "ticker":"MANU"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},      // Buy AAPL
      {"tax": 0},      // Buy MANU
      {"tax": 0},      // Sell AAPL at loss ($50k loss accumulated)
      {"tax": 30000}   // Sell MANU at profit ($200k profit - $50k loss = $150k taxable)
    ]);
  });

  test('Example #3: Profit first, then loss (loss doesn\'t affect previous tax)', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 10000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":15, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":30, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":5, "quantity": 10000, "ticker":"AAPL"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},      // Buy AAPL
      {"tax": 0},      // Buy MANU
      {"tax": 30000},  // Sell MANU at profit ($150k profit, full tax)
      {"tax": 0}       // Sell AAPL at loss (loss accumulated for future)
    ]);
  });

  test('Multiple small operations under exemption threshold', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 800, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":15, "quantity": 800, "ticker":"MANU"}, {"operation":"sell", "unit-cost":20, "quantity": 800, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":20, "quantity": 800, "ticker":"MANU"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},  // Buy AAPL
      {"tax": 0},  // Buy MANU  
      {"tax": 0},  // Sell AAPL at profit but under $20k threshold
      {"tax": 0}   // Sell MANU at profit but under $20k threshold
    ]);
  });

  test('Mixed ticker operations with partial sells', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 20000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":5, "quantity": 10000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":15, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":30, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":20, "quantity": 10000, "ticker":"AAPL"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},      // Buy AAPL 20k shares
      {"tax": 0},      // Sell AAPL 10k shares at loss ($50k loss)
      {"tax": 0},      // Buy MANU
      {"tax": 20000},  // Sell MANU at profit ($150k - $50k = $100k taxable)
      {"tax": 20000}   // Sell remaining AAPL at profit ($100k profit)
    ]);
  });

  test('Error handling: sell more than owned for specific ticker', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 1000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":20, "quantity": 1500, "ticker":"AAPL"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},
      {"error": "Can't sell more stocks than you have"}
    ]);
  });

  test('Error handling: sell non-existent ticker', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 1000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":20, "quantity": 500, "ticker":"GOOGL"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},
      {"error": "Can't sell more stocks than you have"}
    ]);
  });

  test('Complex scenario with multiple buys/sells per ticker', async () => {
    const input = `[{"operation":"buy", "unit-cost":10, "quantity": 5000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":20, "quantity": 5000, "ticker":"AAPL"}, {"operation":"buy", "unit-cost":15, "quantity": 10000, "ticker":"MANU"}, {"operation":"sell", "unit-cost":5, "quantity": 10000, "ticker":"AAPL"}, {"operation":"sell", "unit-cost":30, "quantity": 10000, "ticker":"MANU"}]`;

    const output = await runCLIWithInput(input);
    
    const result = JSON.parse(output);
    expect(result).toEqual([
      {"tax": 0},      // Buy AAPL 5k @ $10
      {"tax": 0},      // Buy AAPL 5k @ $20 (weighted avg = $15)
      {"tax": 0},      // Buy MANU 10k @ $15
      {"tax": 0},      // Sell AAPL at loss (10k @ $5 vs avg $15 = $100k loss)
      {"tax": 10000}   // Sell MANU at profit ($150k - $100k loss = $50k taxable)
    ]);
  });
});