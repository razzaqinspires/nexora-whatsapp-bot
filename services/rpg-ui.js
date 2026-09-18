/** V17 unified RPG UI: AIRich + native flow in one transmission, canvas first. */
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let AIRich=null; try { AIRich=require('../lib/helpers.cjs').AIRich; } catch {}

export async function sendRpgScreen(m,{title='NEXORA RPG',subtitle='V17',body='',footer='NEXORA RPG ENGINE v17',image=null,buttons=[],sections=[],listTitle='Pilih Aksi'}={}){
  const sock=m?.sock || m?.client || null;
  if(AIRich && sock){
    try{
      const card=new AIRich(sock).setTitle(title).setFooter(footer);
      if(body) card.addSubmessage({messageType:2,messageText:body});
      if(image) card.setImage(image);
      if(subtitle) card.addTip(subtitle);
      for(const b of buttons||[]) if(b?.id) card.addReply(String(b.title||b.text||'Action').slice(0,20),String(b.id));
      if(sections?.length) card.addButton('single_select',{title:listTitle,sections:sections.map(s=>({title:s.title||'Options',rows:(s.rows||[]).map(r=>({header:r.header||'',title:r.title||r.displayText||r.id,description:r.description||'',id:r.id||r.rowId})).filter(r=>r.id)})).filter(s=>s.rows.length)});
      return await card.send(m.chat,{quoted:m.raw||m});
    }catch(e){ console.warn('[RPG UI] AIRich fallback:',e?.message||e); }
  }
  const native=[];
  for(const b of buttons||[]) if(b?.id) native.push({name:'quick_reply',title:String(b.title||b.text||'Action').slice(0,20),id:String(b.id)});
  if(sections?.length) native.push({name:'single_select',title:listTitle,sections});
  if(typeof m.sendInteractive==='function') try{return await m.sendInteractive({title,subtitle,body,footer,image,buttons:native});}catch{}
  const fallback=[body,...(sections||[]).flatMap(s=>[(s.title?`\n*${s.title}*`:''),...(s.rows||[]).map(r=>`• ${r.title} → ${r.rowId||r.id}`)]),...native.filter(x=>x.name==='quick_reply').map(x=>`• ${x.title}: ${x.id}`)].filter(Boolean).join('\n');
  return m.reply(image?{image,caption:fallback,footer}:{text:fallback});
}
export function quick(id,title){return{id,title};}
export function rows(items=[],prefix='',command='battle'){return items.map(x=>({header:x.header||'RPG',title:`${prefix}${command} ${x.id}`.slice(0,24),description:String(x.description||'').slice(0,72),id:`${prefix}${command} ${x.id}`}));}
