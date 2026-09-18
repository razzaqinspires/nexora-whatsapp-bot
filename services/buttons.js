const enabled = String(process.env.BUTTONS_ENABLED ?? 'true').toLowerCase() !== 'false';
function cleanButton(button={}){ return {buttonId:String(button.id??'').trim(),buttonText:{displayText:String(button.text??'').trim().slice(0,20)},type:1}; }
export function buttonPayload({text='',footer='NEXORA v17.0',buttons=[],image,caption}={}){const safe=buttons.map(cleanButton).filter(x=>x.buttonId&&x.buttonText.displayText).slice(0,3);return image?{image,caption:caption??text,footer:String(footer),buttons:safe}:{text,footer:String(footer),buttons:safe};}
export async function sendButtons(m,data={}){const safe=(data.buttons||[]).map(cleanButton).filter(x=>x.buttonId&&x.buttonText.displayText).slice(0,3);if(!enabled||!safe.length)return m.reply(data.image?{image:data.image,caption:data.caption??data.text}:{text:data.text||''});try{return await m.reply(buttonPayload({...data,buttons:safe}));}catch{return m.reply({text:`${data.text||data.caption||''}\n\nPilihan cepat: ${safe.map(x=>x.buttonId).join(' • ')}`.trim()});}}
export function button(id,text){return{id,text};}
export async function sendInteractive(m,{type='buttons',text='',image,caption,footer,buttons=[],sections=[],cards=[]}={}){
  const title='NEXORA';
  if(type==='text') return m.reply({text:caption||text});
  if(type==='image') return m.reply({image,caption:caption||text});
  const nativeButtons=buttons.map(b=>({name:'quick_reply',id:String(b.id||''),title:String(b.text||'').slice(0,20)})).filter(b=>b.id&&b.title).slice(0,3);
  const nativeSections=sections.map(s=>({title:s.title||'Options',rows:(s.rows||[]).map(r=>({title:r.title||r.displayText||r.id,description:r.description||'',rowId:r.rowId||r.id})).filter(r=>r.rowId)})).filter(s=>s.rows.length);
  try {
    if(typeof m.sendInteractive==='function' && type!=='image') {
      if(type==='buttons' && nativeButtons.length) return await m.sendInteractive({title,body:caption||text,footer,buttons:nativeButtons});
      if(type==='list' && nativeSections.length) return await m.sendInteractive({title,body:caption||text,footer,sections:nativeSections,listTitle:'Pilih Musuh',display_text:'Pilih Musuh'});
      if(type==='carousel' && cards.length) {
        const carouselButtons=cards.slice(0,10).map(c=>({name:'quick_reply',id:String(c.id||''),title:String(c.title||'Open').slice(0,20)})).filter(x=>x.id);
        return await m.sendInteractive({title,body:caption||text,footer,buttons:carouselButtons});
      }
    }
  } catch {}
  if(type==='buttons' && nativeButtons.length) return sendButtons(m,{image,text,caption,footer,buttons:nativeButtons.map(b=>({id:b.id,text:b.title}))});
  const lines=[caption||text];
  for(const s of nativeSections) { lines.push(`\n*${s.title}*`); for(const r of s.rows) lines.push(`• ${r.title} → ${r.rowId}`); }
  for(const c of cards) lines.push(`• ${c.title||'Card'} → ${c.id||'-'}`);
  return m.reply({text:lines.join('\n').trim()});
}
