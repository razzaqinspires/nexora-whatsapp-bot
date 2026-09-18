import { askAI } from '../services/ai.js';
import { getState, persistGamification } from '../lib/state.js';
import { userKey } from '../lib/gamification.js';
import { memoryContext, rememberInteraction } from '../lib/ai-memory.js';
import { localAssistant } from '../lib/ai-local.js';
export default {name:'ask',version:'15.0.3',aliases:['ai','chat','tanya'],usage:'ask <pesan>',category:'ai',help:'NEXORA AI dengan multi-provider smart fallback',async execute({m,rawArgs}){
 const prompt=rawArgs.trim();if(!prompt)return m.reply({text:'Contoh: .ask jelaskan IoT dengan bahasa sederhana.'});
 const state=getState(),key=userKey(m);state.aiChats ||= {};const history=Array.isArray(state.aiChats[key])?state.aiChats[key]:[];
 const transcript=history.slice(-10).map(x=>`${x.role==='assistant'?'NEXORA':'USER'}: ${x.content}`).join('\n');
 const mem=await memoryContext(m,6);
 const input=[mem?`LONG-TERM MEMORY:\n${mem}`:'',transcript,`USER: ${prompt}`].filter(Boolean).join('\n');
 const result=await askAI(input,{system:'Kamu adalah NEXORA, asisten AI WhatsApp yang ringkas, cerdas, aman, profesional, dan komunikatif. Jawab Bahasa Indonesia kecuali diminta lain. Jangan mengaku memiliki akses yang tidak diberikan.'});
 if(!result.ok){ const fallback=localAssistant(prompt); return m.reply({text:`*NEXORA AI*\nStatus: ${result.code}\nProvider: ${result.provider||'-'}\nMode: LOCAL FALLBACK\n\n${fallback}`}); }
 history.push({role:'user',content:prompt},{role:'assistant',content:result.text}); await rememberInteraction(m,prompt,result.text);state.aiChats[key]=history.slice(-12);await persistGamification();
 return m.reply({text:`*NEXORA AI*\nProvider: ${result.provider} • ${result.model}\n\n${result.text}`});
}};
