import { aiHealth } from '../services/ai.js';
export default {name:'aistatus',version:'17.0.0',aliases:['aiproviders','aihealth'],usage:'aistatus',help:'Status provider AI dan smart fallback',ownerOnly:true,async execute({m}){const rows=aiHealth().map((x,i)=>`${i+1}. ${x.name} • ${x.model} • ${x.ok?'READY':'COOLDOWN/INCOMPLETE'} • fail=${x.failures} • ok=${x.success}`).join('\n');return m.reply({text:`*NEXORA AI ROUTER v17*

${rows||'Tidak ada provider.'}`});}};
