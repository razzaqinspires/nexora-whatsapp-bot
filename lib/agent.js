import { askWithFallback } from './ai-router.js';
import { memoryContext, rememberInteraction } from './ai-memory.js';

const registry = new Map();
export function registerAgentTool(name, definition, handler) { registry.set(name, { name, ...definition, handler }); }
export function listAgentTools() { return [...registry.values()].map(({handler,...x})=>x); }

function safeJson(value){ try{return JSON.stringify(value);}catch{return String(value);} }
function heuristic(prompt){
  const q=String(prompt||'').toLowerCase();
  if(/menu|command/.test(q)) return {tool:'menu',args:{}};
  if(/profil|profile/.test(q)) return {tool:'profile',args:{}};
  if(/inventory|item|tas/.test(q)) return {tool:'inventory',args:{}};
  if(/leaderboard|peringkat/.test(q)) return {tool:'leaderboard',args:{}};
  if(/map|peta|dunia/.test(q)) return {tool:'map',args:{}};
  return null;
}
export async function agentRespond(prompt, context={}, options={}) {
  const tools=listAgentTools();
  const system = options.system || `Kamu adalah NEXORA Agent. Jawab Bahasa Indonesia secara profesional.\nTool tersedia: ${safeJson(tools)}\nJika perlu menjalankan tool, keluarkan tepat satu JSON: {"tool":"nama","args":{...}}. Jika tidak perlu tool, jawab normal.`;
  const memory=await memoryContext(context.m,6);
  const enriched=memory?`LONG-TERM MEMORY:\n${memory}\n\nUSER REQUEST:\n${String(prompt)}`:String(prompt);
  const result=await askWithFallback([{role:'user',content:enriched}],{system});
  if(!result.ok) return result;
  await rememberInteraction(context.m,prompt,result.text);
  const text=result.text.trim();
  let call=null; try { call=JSON.parse(text); } catch { const m=text.match(/\{[\s\S]*\}/); if(m){try{call=JSON.parse(m[0]);}catch{}} }
  if(call?.tool && registry.has(call.tool)) {
    const t=registry.get(call.tool);
    try { const out=await t.handler(call.args||{}, context); return {...result, toolCall:call, toolResult:out, text:typeof out==='string'?out:safeJson(out)}; }
    catch(e){ return {...result, toolCall:call, toolError:e.message, text:`Tool ${call.tool} gagal: ${e.message}`}; }
  }
  const h=heuristic(prompt);
  if(h && registry.has(h.tool)) { const out=await registry.get(h.tool).handler(h.args,context); return {...result, toolCall:h, toolResult:out, text:typeof out==='string'?out:safeJson(out)}; }
  return result;
}
