import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../lib/parser.js';
test('parser quoted caption',()=>{ const p=parseCommand('/upload "hello world"',{prefixMode:'single',prefix:'/'}); assert.equal(p.command,'upload'); assert.deepEqual(p.args,['hello world']); });
test('non-command text',()=>assert.equal(parseCommand('hello',{prefixMode:'single',prefix:'/'}),null));
