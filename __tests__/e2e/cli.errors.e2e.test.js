import { expect, jest } from '@jest/globals';
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
  return JSON.parse(line).map(x => x.tax ?? x.error);
}

describe('CLI errors - stock validation', () => {
  jest.setTimeout(10000);

  test('Validation - Input #1)', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20,"quantity":11000}]'
    ];

    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 'Can\'t sell more stocks than you have']);
  });

  test('Validation - Input #2', async () => {
    const lines = [
      '[{"operation":"buy","unit-cost":10,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20,"quantity":11000},' +
        '{"operation":"sell","unit-cost":20,"quantity":5000}]'
    ];

    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([0, 'Can\'t sell more stocks than you have', 10000]);
  });

  test('Error limit blocks after 3 consecutive insufficient stock errors', async () => {
    const lines = [
      '[{"operation":"sell","unit-cost":20,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20,"quantity":10000},' +
        '{"operation":"sell","unit-cost":20,"quantity":10000},' +
        '{"operation":"buy","unit-cost":10,"quantity":10000}]'
    ];

    const out = await runCli(lines);
    expect(taxes(out[0])).toEqual([
      'Can\'t sell more stocks than you have',
      'Can\'t sell more stocks than you have',
      'Can\'t sell more stocks than you have',
      'Your account is blocked'
    ]);
  });
});
