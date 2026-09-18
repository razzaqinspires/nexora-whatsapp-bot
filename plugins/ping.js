import { createRequire } from 'node:module';
import { runtimeSnapshot, runtimeUrl } from '../services/runtime-web.js';
const require=createRequire(import.meta.url);
let AIRich=null;try{AIRich=require('../lib/helpers.cjs').AIRich}catch{}
function fmt(sec){sec=Math.max(0,Math.floor(sec||0));const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60),s=sec%60;return d?`${d}d ${h}h ${m}m ${s}s`:h?`${h}h ${m}m ${s}s`:m?`${m}m ${s}s`:`${s}s`}
export default {name:'ping',version:'15.0.3',aliases:['pinglive','p','speed'],usage:'ping',category:'core',help:'Rich live server telemetry + latency',async execute({m,sock}){
  const t=process.hrtime.bigint();const data=runtimeSnapshot();const latency=Number(process.hrtime.bigint()-t)/1e6;const url=runtimeUrl();
  const externalAdReply={title:'NEXORA Server Live',body:`LIVE • ${latency.toFixed(2)} ms • ${url}`,mediaType:1,renderLargerThumbnail:true,showAdAttribution:false,sourceUrl:url};
  const text=`📡 *NEXORA SERVER LIVE v15.0.3*\n\n⚡ Latency: *${latency.toFixed(2)} ms*\n🟢 Status: *ONLINE*\n⏱️ Bot Uptime: *${fmt(data.uptimeMs/1000)}*\n🖥️ System: *${data.node}*\n🧠 RSS: *${(data.memory.rss/1048576).toFixed(1)} MB*\n📦 Commands: *${data.commands}*\n❌ Errors: *${data.errors}*\n\n🌐 Live Runtime:\n${url}`;
  if(AIRich){try{const card=new AIRich(sock).setTitle('📡 SERVER LIVE').setFooter(`NEXORA v15.0.3 • ${url}`);card.addSubmessage({messageType:2,messageText:text});card.addSection({text:`LIVE RUNTIME\n${url}\n\nLatency ${latency.toFixed(2)} ms\nUptime ${fmt(data.uptimeMs/1000)}\nNode ${data.node}\nRSS ${(data.memory.rss/1048576).toFixed(1)} MB`,__typename:'GenAIMarkdownTextUXPrimitive'});return await card.send(m.chat,{quoted:m.raw});}catch(e){}}
  return m.reply({text,contextInfo:{externalAdReply}});
}};
