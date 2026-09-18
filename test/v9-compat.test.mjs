import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../lib/parser.js';
import { findConflicts, similarity } from '../lib/command-registry.js';

test('v9 compatibility parser single prefix', () => {
  const p=parseCommand('.ping "hello world"', {prefixMode:'single',prefix:'.'});
  assert.equal(p.command,'ping'); assert.deepEqual(p.args,['hello world']); assert.equal(p.prefix,'.');
});
test('v9 compatibility parser multi prefix', () => {
  const p=parseCommand('!status now', {prefixMode:'multi',prefixes:['.','!']});
  assert.equal(p.command,'status'); assert.equal(p.prefix,'!');
});
test('v9 compatibility parser no prefix', () => { assert.equal(parseCommand('menu', {prefixMode:'none'}).command,'menu'); });
test('v9 compatibility conflict engine', () => {
  const c=findConflicts({name:'ping',aliases:['p']},[{name:'ping',aliases:['pong']}]);
  assert.equal(c.exact.length,1); assert.equal(similarity('pimg','ping')>0.7,true);
});

import { parseCommand as parse } from '../lib/parser.js';
test('v9.0.3 persisted multi prefix routing', () => {
  const cfg = { prefixMode: 'multi', prefixes: ['.', '!', '#', '/'], prefix: '.' };
  assert.equal(parse('.menu', cfg).command, 'menu');
  assert.equal(parse('!menu', cfg).command, 'menu');
  assert.equal(parse('#menu', cfg).command, 'menu');
  assert.equal(parse('/menu', cfg).command, 'menu');
});
