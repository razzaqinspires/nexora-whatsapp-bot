import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('V17 battle gate is visual and native-flow driven',()=>{const s=fs.readFileSync(new URL('../plugins/battle.js',import.meta.url),'utf8');for(const x of ['renderBattleSelectionCanvas','selectionSections','BATTLE GATE v17'])assert.ok(s.includes(x));});
test('V17 skill codex is visual and exposes expanded actions',()=>{const s=fs.readFileSync(new URL('../plugins/skill.js',import.meta.url),'utf8');const r=fs.readFileSync(new URL('../lib/rpg.js',import.meta.url),'utf8');for(const x of ['renderSkillBookCanvas','SKILL CODEX v17'])assert.ok(s.includes(x));for(const x of ['execute:','thunder:','focus:','battlecry:','meditate:'])assert.ok(r.includes(x));});
test('V17 RPG UI centralizes canvas plus native actions',()=>{const s=fs.readFileSync(new URL('../services/rpg-ui.js',import.meta.url),'utf8');for(const x of ['m.sendInteractive','image','single_select','quick'])assert.ok(s.includes(x));});
test('V17 ping follows AIRich live-card pattern',()=>{const s=fs.readFileSync(new URL('../plugins/ping.js',import.meta.url),'utf8');for(const x of ['new AIRich(active)','addSubmessage','addSection(payload(d))','card.send(m.chat','FOAHtmlPrimitiveDemoDONOTUSE','setInterval'])assert.ok(s.includes(x));});
