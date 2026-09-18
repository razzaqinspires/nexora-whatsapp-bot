import { agentRespond, registerAgentTool } from '../lib/agent.js';
import { getUserProfile } from '../lib/gamification.js';
import { inventorySummary } from '../lib/gamification.js';
import { mapState } from '../lib/game.js';
registerAgentTool('profile',{description:'Ambil profile user'},async(_,ctx)=>getUserProfile(ctx.m));
registerAgentTool('inventory',{description:'Ambil inventory user'},async(_,ctx)=>inventorySummary(ctx.m));
registerAgentTool('map',{description:'Ambil posisi world map'},async(_,ctx)=>mapState(ctx.m));
registerAgentTool('menu',{description:'Daftar command'},async(_,ctx)=>ctx.router.help(ctx.prefix||'.'));
export default {name:'agent',version:'17.0.0',aliases:['agentai'],usage:'agent <request>',category:'ai',help:'NEXORA Agent dengan tool routing',async execute(ctx){const r=await agentRespond(ctx.rawArgs,{m:ctx.m,router:ctx.router,prefix:ctx.prefix});return ctx.m.reply({text:r.ok?`*NEXORA AGENT*\nProvider: ${r.provider}\n\n${r.text}`:`*NEXORA AGENT*\nStatus: ${r.code}\nProvider: ${r.provider||'-'}`});}};
