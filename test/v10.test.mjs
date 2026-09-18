import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../lib/parser.js';
import { RARITY_RATES, MAX_EQUIPPED } from '../lib/leveling.js';

test('v10 multi-prefix routing is stable',()=>{
 for(const p of ['.','!','#','/']) assert.equal(parseCommand(`${p}menu`,{prefixMode:'multi',prefixes:['.','!','#','/']}).command,'menu');
});
test('v10 prefix recovery bootstrap',()=>assert.equal(parseCommand('.setprefix multi', {prefixMode:'single',prefix:'$'}).command,'setprefix'));
test('v10 typo parser remains strict before router suggestion',()=>assert.equal(parseCommand('.mneu',{prefixMode:'single',prefix:'.'}).command,'mneu'))
test('v10 rarity/equipment contract',()=>{assert.equal(Object.values(RARITY_RATES).reduce((a,b)=>a+b,0),100);assert.equal(MAX_EQUIPPED,3);});
