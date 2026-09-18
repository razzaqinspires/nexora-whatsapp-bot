import path from 'node:path';
import { normalizeCommandName } from '../lib/command-registry.js';

const categories = {
  admin: ['admin','owner','premium','plugin','maintenance','mode','prefix','permission','security'],
  tools: ['ping','status','health','convert','calc','search','download','upload','ocr','pdf'],
  group: ['group','kick','ban','promote','demote','tagall','mute'],
  automation: ['schedule','auto','cron','reminder','job'],
  ai: ['ai','gpt','ask','vision','prompt','agent'],
  media: ['image','video','audio','sticker','media','photo'],
  system: ['reload','config','stats','debug','event','console','test']
};

export function planPlugin(source, existingPlugins=[]) {
  const text=String(source||'');
  const m=text.match(/\bname\s*:\s*['"]([^'"]+)['"]/); const name=normalizeCommandName(m?.[1] || 'newcmd');
  const aliasM=text.match(/\baliases\s*:\s*\[([^\]]*)\]/s); const aliases=aliasM?[...aliasM[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>normalizeCommandName(x[1])).filter(Boolean):[];
  const hay=(name+' '+aliases.join(' ')+' '+text.slice(0,2000)).toLowerCase();
  let category='tools', score=0;
  for(const [cat, words] of Object.entries(categories)){ const s=words.reduce((n,w)=>n+(hay.includes(w)?1:0),0); if(s>score){score=s;category=cat;} }
  const folder=path.posix.join('plugins',category);
  const existing=existingPlugins.find(p=>p.name===name || p.aliases?.includes(name));
  return { name, aliases, category, folder, file:path.posix.join(folder,`${name}.js`), confidence:Math.min(0.99,0.55+score*0.08), conflict:existing?.name||null, rationale:`Kategori dipilih dari nama, alias, dan isi plugin.` };
}
