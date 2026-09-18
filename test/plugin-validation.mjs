import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePluginSource } from '../validator/plugin-validator.js';

test('valid plugin structure', async()=>{
 const r=await validatePluginSource("export default { name:'hello', aliases:['hi'], async execute({m}) { await m.reply({text:'ok'}); } };",[]);
 assert.equal(r.ok,true); assert.equal(r.name,'hello');
});
test('reject command collision', async()=>{
 const r=await validatePluginSource("export default { name:'ping', async execute() {} };",[{name:'ping',aliases:[]}]);
 assert.equal(r.ok,false); assert.match(r.errors.join(' '),/Bentrok/);
});
