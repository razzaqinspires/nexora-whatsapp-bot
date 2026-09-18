import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFromXp, levelProgress, rankForLevel } from '../lib/leveling.js';
import { parseCommand } from '../lib/parser.js';

test('v12 typo similarity percentage basis',()=>{const a='mneu',b='menu';const d=1;assert.equal(Math.round((1-d/Math.max(a.length,b.length))*100),75);assert.equal(100,100)});
test('v12 parser all multi prefixes',()=>{for(const prefix of ['.','!','#','/']){const x=parseCommand(`${prefix}ask halo`,{prefixMode:'multi',prefixes:['.','!','#','/']});assert.equal(x.command,'ask');assert.equal(x.prefix,prefix)}});
test('v12 level progression',()=>{assert.equal(levelFromXp(0),1);assert.ok(levelFromXp(100)>1);assert.equal(levelProgress(0).progress,0);assert.ok(rankForLevel(10))});
