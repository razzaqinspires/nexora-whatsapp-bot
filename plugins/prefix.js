import { getPrefixConfig } from '../lib/prefix.js';
export default { version:'17.0.0',  name:'prefixstatus', aliases:['prefixinfo'], usage:'prefixstatus', help:'Lihat konfigurasi prefix aktif', async execute({m,config}) { const p=getPrefixConfig(config); return m.reply({text:`*PREFIX*\nMode: ${p.mode}\nPrefixes: ${p.mode==='none'?'(tanpa prefix)':p.prefixes.join(' ')}`}); } };
