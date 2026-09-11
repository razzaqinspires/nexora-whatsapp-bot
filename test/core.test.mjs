import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../lib/parser.js';

test('parser handles quoted upload caption', () => {
  const parsed = parseCommand('/upload "NEXORA — AI & Robotics"', '/');
  assert.equal(parsed.command, 'upload');
  assert.deepEqual(parsed.args, ['NEXORA — AI & Robotics']);
});

test('parser ignores non command text', () => {
  assert.equal(parseCommand('hello', '/'), null);
});
