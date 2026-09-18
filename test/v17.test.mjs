import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V17 AIRich UI exposes native replies and single-select in one card',()=>{const s=fs.readFileSync(new URL('../services/rpg-ui.js',import.meta.url),'utf8');for(const x of ['AIRich','addReply','addButton','single_select','card.send'])assert.ok(s.includes(x));});
test('V17 original platform runner has persistent state and actions',()=>{const s=fs.readFileSync(new URL('../lib/mario.js',import.meta.url),'utf8');for(const x of ['MARIO_ACTIONS','startMario','marioAction','lives','score','coins','stamina','LEVELS'])assert.ok(s.includes(x));});
test('V17 Mario command is canvas plus native flow',()=>{const s=fs.readFileSync(new URL('../plugins/mario.js',import.meta.url),'utf8');for(const x of ['renderMarioCanvas','sendRpgScreen','mario start','Jump','Dash'])assert.ok(s.includes(x));});
test('V17 arcade menu category is wired',()=>{const a=fs.readFileSync(new URL('../services/menu.js',import.meta.url),'utf8');const b=fs.readFileSync(new URL('../plugins/menu.js',import.meta.url),'utf8');assert.ok(a.includes('arcade'));assert.ok(b.includes('arcade'));});
