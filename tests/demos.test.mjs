// Every task the case can set has a "Watch how" demo, and every beat is one the player can draw.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEMOS} from '../src/content/demos.js';

const KINDS = ['app', 'launch', 'menu', 'item', 'dialog', 'press', 'tabs', 'rows', 'card', 'choose', 'check', 'type', 'toast', 'taskbar', 'devices', 'power', 'plug', 'insert', 'lift'];

test('every task has a demo', () => {
  const ids = [...readFileSync('src/core/state.js', 'utf8').matchAll(/task\('([a-zA-Z]+)'/g)].map(m => m[1]).filter(id => id !== 'done');
  const bench = readFileSync('src/desktop/equipment.js', 'utf8'), from = bench.indexOf('export function nextStep');
  const steps = [...bench.slice(from, bench.indexOf('\n}', from)).matchAll(/return '([a-z]+)';/g)].map(m => `bench:${m[1]}`);
  for (const key of new Set([...ids, ...steps])) assert.ok(DEMOS[key], `no demo for ${key}`);
});

test('every beat is a kind the player draws, and every demo says what to do', () => {
  for (const [key, beats] of Object.entries(DEMOS)) {
    for (const beat of beats) assert.ok(KINDS.some(k => k in beat), `${key}: unknown beat ${JSON.stringify(beat)}`);
    assert.ok(beats.some(b => b.say), `${key}: no caption`);
  }
});
