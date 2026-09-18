import fs from 'node:fs/promises';
import path from 'node:path';
import { validatePluginSource } from '../validator/plugin-validator.js';
import { planPlugin } from '../ai/agent.js';

export async function installPluginFromSource(source, router) {
  const plugins=router.list();
  const plan=planPlugin(source,plugins);
  const validation=await validatePluginSource(source,plugins);
  if(!validation.ok) return {ok:false,plan,validation};
  const file=path.resolve(plan.file);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,String(source).trim()+'\n','utf8');
  return {ok:true,plan,validation,file};
}

export async function removePlugin(name, router) {
  const plugin=router.list().find(p=>p.name===name || p.aliases?.includes(name));
  if(!plugin) return {ok:false,error:`Plugin ${name} tidak ditemukan.`};
  if(plugin.nonDisableable) return {ok:false,error:'Plugin ini dilindungi dan tidak boleh dihapus.'};
  const file=plugin.__file || path.resolve('./plugins',`${plugin.name}.js`);
  await fs.rm(file,{force:true});
  return {ok:true,name:plugin.name,file};
}
