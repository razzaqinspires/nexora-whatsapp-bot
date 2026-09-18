import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function walk(dir) {
  const out=[];
  for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...await walk(full));
    else if(entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out.sort();
}

export async function loadPlugins() {
  const dir=path.resolve('./plugins');
  await fs.mkdir(dir,{recursive:true});
  const files=await walk(dir);
  const loaded=[];
  for(const file of files){
    try {
      const url=`${pathToFileURL(file).href}?v=${Date.now()}-${Math.random()}`;
      const mod=await import(url);
      const plugin=mod.default||mod.plugin;
      if(!plugin?.name || typeof plugin.execute!=='function') continue;
      const relative = path.relative(dir, file);
      const AUTO_CATEGORIES = {
      core: new Set(['menu','ping','status','health','config','reload','whoami','prefixstatus','setprefix','plugin','events','validate','test','getmethod','addcmd','delcmd']),
      group: new Set(['add','kick','kickall','promote','demote','welcome','leave','linkgroup','revoke','setname','setdesc','tagall','hidetag','approve','reject','requests','ephemeral','close','open','lock','unlock','groupinfo']),
      game: new Set(['profile','character','inventory','gacha','equip','unequip','use','leaderboard','dashboard','map','enemy','dungeon','battle','skill','battleproof','flee','attack','duel','tournament','story','quest','achievements','guild']),
      download: new Set(['download','downloadstatus','ytdl','play','ytmp3','ttdl','igdl','fbdl','upload']),
      ai: new Set(['agent','ask','ai','chat','tanya','aistatus','nexora']),
      economy: new Set(['daily','pay']),
      owner: new Set(['eval','ownerctl','cache','menuset','maintenance','security','admin','autoupload']),
      premium: new Set(['jadibot']),
      system: new Set(['memory']),
      social: new Set(['menfess'])
    };
    let category = plugin.category;
    if (!category) {
      category = Object.entries(AUTO_CATEGORIES).find(([, names]) => names.has(String(plugin.name).toLowerCase()))?.[0];
    }
    category ||= (path.dirname(relative) === '.' ? 'core' : path.dirname(relative).split(path.sep)[0]);
      loaded.push(Object.freeze({...plugin, version: plugin.version || '15.0.3', category, __file:file}));
    } catch(error) {
      console.error(`[PLUGIN] gagal load ${path.relative(process.cwd(),file)}: ${error.message}`);
    }
  }
  return loaded;
}
