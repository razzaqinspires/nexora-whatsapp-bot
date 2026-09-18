import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../lib/parser.js';
import { levelFromXp, levelProgress, rankForLevel, RARITY_RATES, MAX_EQUIPPED } from '../lib/leveling.js';

test('v9 setprefix bootstrap can recover from changed prefix', () => {
  const parsed = parseCommand('.setprefix multi . ! # /', { prefixMode:'single', prefix:'!' });
  assert.equal(parsed.command, 'setprefix');
  assert.equal(parsed.args[0], 'multi');
});

test('v9 no-prefix mode supports plain and bootstrap setprefix', () => {
  assert.equal(parseCommand('setprefix single .', { prefixMode:'none' }).command, 'setprefix');
  assert.equal(parseCommand('.setprefix single !', { prefixMode:'none' }).command, 'setprefix');
});

test('v9 level math and rarity rates are deterministic', () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(100), 2);
  assert.equal(levelProgress(150).level, 2);
  assert.equal(levelProgress(150).progress, 17);
  assert.equal(rankForLevel(100), 'NEXORA LEGEND');
  assert.equal(Object.values(RARITY_RATES).reduce((a,b)=>a+b,0), 100);
  assert.equal(MAX_EQUIPPED, 3);
});

