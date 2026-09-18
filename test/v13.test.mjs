import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs/promises';
const src=await fs.readFile(new URL('../lib/rpg.js',import.meta.url),'utf8');
test('enemy database exposes core combat stats',()=>{for(const x of ['abyss_dragon','maxHp','atk','mdef'])assert.match(src,new RegExp(x));});
test('dungeon database has rooms and boss',()=>{assert.match(src,/singularity_core/);assert.match(src,/abyss_dragon/);});
test('status registry covers major combat effects',()=>{for(const x of ['poison','burn','freeze','stun','silence','bleed','armor_break','slow','fear','petrify'])assert.match(src,new RegExp(x));});
test('enemy ids are unique in source',()=>{const ids=[...src.matchAll(/\n\s*([a-z_]+):enemy\(/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);});
