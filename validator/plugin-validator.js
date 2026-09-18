import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { commandKeys, findConflicts, normalizeCommandName } from '../lib/command-registry.js';

export async function validatePluginSource(source, plugins = []) {
  const text=String(source||'').trim();
  const errors=[], warnings=[];
  if(!text) errors.push('Kode kosong.');
  if(!/export\s+default\s+\{/.test(text) && !/export\s+const\s+plugin\s*=/.test(text)) errors.push('Tidak ditemukan export plugin yang dikenali.');
  if(!/execute\s*[:(]/.test(text)) errors.push('Plugin wajib memiliki execute().');
  const nameMatch=text.match(/\bname\s*:\s*['"]([^'"]+)['"]/);
  const name=normalizeCommandName(nameMatch?.[1]);
  if(!name) errors.push('name command tidak ditemukan/invalid.');
  const aliasMatch=text.match(/\baliases\s*:\s*\[([^\]]*)\]/s);
  const aliases=aliasMatch ? [...aliasMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>normalizeCommandName(m[1])).filter(Boolean) : [];
  const candidate={name,aliases};
  if(name){
    const c=findConflicts(candidate,plugins);
    if(c.exact.length) errors.push(`Bentrok command: ${c.exact.map(x=>`${x.plugin}:${x.key}`).join(', ')}`);
    if(c.similar.length) warnings.push(`Kemiripan tinggi: ${c.similar.map(x=>`${x.plugin}:${x.key} (${Math.round(x.score*100)}%)`).join(', ')}`);
  }
  const tmp=path.join(process.cwd(),'.nexora-plugin-validation.tmp.mjs');
  await fs.writeFile(tmp,text,'utf8');
  const syntax=await checkNode(tmp);
  await fs.rm(tmp,{force:true});
  if(!syntax.ok) errors.push(`Syntax error: ${syntax.error}`);
  // Deliberately reject obvious process/fs execution primitives from uploaded source.
  for(const bad of ['child_process','execSync(','spawnSync(','process.exit','rm -rf','eval(','new Function(']) if(text.includes(bad)) errors.push(`Primitive berbahaya ditolak: ${bad}`);
  for(const imp of [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(x=>x[1])) if(!imp.startsWith('.') && !imp.startsWith('/')) warnings.push(`Dependency eksternal terdeteksi: ${imp}`);
  return { ok:errors.length===0, errors, warnings, name, aliases, keys:commandKeys(candidate) };
}
function checkNode(file){ return new Promise(resolve=>{ const p=spawn(process.execPath,['--check',file],{stdio:['ignore','pipe','pipe']}); let err=''; p.stderr.on('data',d=>err+=d); p.on('close',code=>resolve({ok:code===0,error:err.trim()})); }); }
