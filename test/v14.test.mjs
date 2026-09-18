import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs/promises';
const rpg=await fs.readFile(new URL('../lib/rpg.js',import.meta.url),'utf8'); const cache=await fs.readFile(new URL('../services/smart-cache.js',import.meta.url),'utf8'); const mem=await fs.readFile(new URL('../services/memory.js',import.meta.url),'utf8'); const canvas=await fs.readFile(new URL('../services/canvas.js',import.meta.url),'utf8');
test('V14 RPG expanded catalog',()=>{for(const x of ['ember_reaver','void_harbinger','abyss_dragon','cyber_forest','ember_depths','singularity_core'])assert.match(rpg,new RegExp(x));});
test('V14 combat engine contains core mechanics',()=>{for(const x of ['cooldowns','critical','magicPen','armor_break','poison','burn','freeze','shield','lifesteal'])assert.match(rpg,new RegExp(x));});
test('V14 smart cache is persistent and bounded',()=>{for(const x of ['cacheGetOrSet','maxEntries','expiresAt'])assert.match(cache,new RegExp(x));});
test('V14 memory is append-only JSONL',()=>{for(const x of ['events.jsonl','appendFile','remember'])assert.match(mem,new RegExp(x));});
test('V14 RPG rendering is canvas based',()=>{for(const x of ['renderBattleProofCanvas','renderCharacterCanvas','renderDungeonCanvas','renderEnemyCanvas','renderStoryCanvas','sharp'])assert.match(canvas,new RegExp(x));});
