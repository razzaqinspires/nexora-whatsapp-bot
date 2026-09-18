import { getState } from '../lib/state.js';
export default { version:'15.0.3',  name:'stats', aliases:['statistics'], ownerOnly:true, usage:'stats', help:'Lihat statistik command/error/block', async execute({m}) { const s=getState(); await m.reply({text:`*BOT STATS*\nCommands: ${s.stats.commands||0}\nErrors: ${s.stats.errors||0}\nBlocked: ${s.stats.blocked||0}\nJobs: ${s.stats.jobs||0}
Job errors: ${s.stats.jobErrors||0}
Stored posts: ${s.posts.length}`}); } };
