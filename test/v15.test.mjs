import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTargetJid, createMenfess, getMenfessById, addMessageToSession, closeMenfess } from '../lib/menfess.js';
import fs from 'node:fs';

test('V15 skill book is safe and complete',()=>{const s=fs.readFileSync(new URL('../lib/rpg.js',import.meta.url),'utf8');for(const x of ['basic','power','lifesteal','cooldowns','MP tidak cukup'])assert.ok(s.includes(x));});
test('V15 game menu has RPG subcategory architecture',()=>{const s=fs.readFileSync(new URL('../services/menu.js',import.meta.url),'utf8');for(const x of ['combat','character','world','progression','dashboard',"startsWith(\'game.\')"])assert.ok(s.includes(x));});
test('V15 serializer source covers interactive response families',()=>{const s=fs.readFileSync(new URL('../serializer.js',import.meta.url),'utf8');for(const x of ['buttonsResponseMessage','listResponseMessage','templateButtonReplyMessage','interactiveResponseMessage','nativeFlowResponseMessage'])assert.ok(s.includes(x));});
test('V15 menfess lifecycle',()=>{assert.equal(parseTargetJid('08123456789'),'628123456789@s.whatsapp.net');const s=createMenfess({sender:'628111111111@s.whatsapp.net',recipient:'628222222222@s.whatsapp.net',message:'hello'});assert.ok(getMenfessById(s.id));addMessageToSession(s,s.recipient,'hi');assert.equal(s.history.length,2);assert.equal(closeMenfess(s.id),true);assert.equal(getMenfessById(s.id),null);});
test('V15 enemy catalog has combat stats',()=>{const s=fs.readFileSync(new URL('../lib/rpg.js',import.meta.url),'utf8');for(const x of ['cyber_wolf','abyss_dragon','hp','atk','def','mdef'])assert.ok(s.includes(x));});

test('V15 serializer compatibility bridge and menfess plugin are wired',()=>{const ser=fs.readFileSync(new URL('../serializer.js',import.meta.url),'utf8');const plugin=fs.readFileSync(new URL('../plugins/menfess.js',import.meta.url),'utf8');assert.ok(ser.includes('attachSerializerRuntime'));assert.ok(ser.includes('serializer-compat.cjs'));for(const x of ['menfess reply','menfess close','sock.sendMessage(target'])assert.ok(plugin.includes(x));});
