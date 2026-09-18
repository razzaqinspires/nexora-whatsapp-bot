import { agentRespond, registerAgentTool } from '../lib/agent.js';
import { getUserProfile, inventorySummary } from '../lib/gamification.js';
import { mapState } from '../lib/game.js';
import { localAssistant } from '../lib/ai-local.js';
let registered=false;
function ensureTools(){if(registered)return;registered=true;registerAgentTool('profile',{description:'Ambil profile'},async(_,c)=>getUserProfile(c.m));registerAgentTool('inventory',{description:'Ambil inventory'},async(_,c)=>inventorySummary(c.m));registerAgentTool('map',{description:'Ambil posisi map'},async(_,c)=>mapState(c.m));registerAgentTool('menu',{description:'Daftar command'},async(_,c)=>c.router.help(c.prefix||'.'));}
export default {name:'nexora',version:'17.0.0',aliases:['nx'],usage:'nexora <request>',category:'ai',help:'NEXORA command center / Agent',async execute(ctx){ensureTools();const q=ctx.rawArgs.trim()||'tampilkan status saya';const r=await agentRespond(q,{m:ctx.m,router:ctx.router,prefix:ctx.prefix});return ctx.m.reply({text:r.ok?`*NEXORA AGENT v17.0.0*\nProvider: ${r.provider} • ${r.model}\n\n${r.text}`:`*NEXORA AGENT v17.0.0*\nStatus: ${r.code}\nProvider: ${r.provider||'-'}\nMode: LOCAL FALLBACK\n\n${localAssistant(q)}`});}};
