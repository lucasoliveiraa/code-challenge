import { jest } from '@jest/globals';
import { spawn } from 'node:child_process';

function runCli(lines) {
  return new Promise(resolve => {
    const p = spawn('node', ['./src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let out = '';
    p.stdout.on('data', d => {
      out += d.toString('utf8');
    });
    for (const l of lines) p.stdin.write(l + '\n');
    p.stdin.end();
    p.on('close', () => resolve(out.trim().split(/\n/).filter(Boolean)));
  });
}

function taxes(line) {
  return JSON.parse(line).map(x => x.tax);
}

describe('CLI E2E', () => {
  jest.setTimeout(10000);

  test('Case #1 + Case #2 (duas linhas)', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":100},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":50},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":50}]',
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":5.00,"quantity":5000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0]);
    expect(taxes(out[1])).toEqual([0, 10000, 0]);
  });

  test('Case #1', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":100},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":50},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":50}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0]);
  });

  test('Case #2', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":5.00,"quantity":5000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 10000, 0]);
  });

  test('Case #3', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":5.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":3000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 1000]);
  });

  test('Case #4', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"buy","unit-cost":25.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":10000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0]);
  });

  test('Case #5', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"buy","unit-cost":25.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":25.00,"quantity":5000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0, 10000]);
  });

  test('Case #6', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":2.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":2000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":2000},' +
        '{"operation":"sell","unit-cost":25.00,"quantity":1000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0, 0, 3000]);
  });

  test('Case #7', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":2.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":2000},' +
        '{"operation":"sell","unit-cost":20.00,"quantity":2000},' +
        '{"operation":"sell","unit-cost":25.00,"quantity":1000},' +
        '{"operation":"buy","unit-cost":20.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":15.00,"quantity":5000},' +
        '{"operation":"sell","unit-cost":30.00,"quantity":4350},' +
        '{"operation":"sell","unit-cost":30.00,"quantity":650}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0, 0, 3000, 0, 0, 3700, 0]);
  });

  test('Case #8', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":50.00,"quantity":10000},' +
        '{"operation":"buy","unit-cost":20.00,"quantity":10000},' +
        '{"operation":"sell","unit-cost":50.00,"quantity":10000}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 80000, 0, 60000]);
  });

  test('Case #9', async () => {
    const lines = [
      '[{"operation": "buy", "unit-cost": 5000.00, "quantity": 10},' +
        '{"operation": "sell", "unit-cost": 4000.00, "quantity": 5},' +
        '{"operation": "buy", "unit-cost": 15000.00, "quantity": 5},' +
        '{"operation": "buy", "unit-cost": 4000.00, "quantity": 2},' +
        '{"operation": "buy", "unit-cost": 23000.00, "quantity": 2},' +
        '{"operation": "sell", "unit-cost": 20000.00, "quantity": 1},' +
        '{"operation": "sell", "unit-cost": 12000.00, "quantity": 10},' +
        '{"operation": "sell", "unit-cost": 15000.00, "quantity": 3}]'
    ];
    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 0, 0, 0, 0, 0, 1000, 2400]);
  });
});
