import { createWorker } from 'tesseract.js';
import pdf from 'pdf-parse';

export async function extractReplyPayload(m) {
  const quoted=m?.getQuotedMessage?.();
  const target=quoted || (m?.media?.hasMedia ? m.raw : null);
  if(!target) return {kind:'none',text:''};
  const text=m?.quoted?.text || (quoted ? extractRawText(quoted) : '') || extractQuotedContextText(m?.raw);
  const mediaType=target?.message ? Object.keys(target.message)[0] : m?.media?.type;
  if(mediaType==='imageMessage') return {kind:'image',text:await ocrMessage(m,target)};
  if(mediaType==='documentMessage') return {kind:'document',text:await documentText(m,target)};
  if(text) return {kind:'text',text};
  return {kind:'unknown',text:''};
}

function extractQuotedContextText(msg){ const ctx=msg?.message?.extendedTextMessage?.contextInfo; const q=ctx?.quotedMessage||{}; return q.conversation||q.extendedTextMessage?.text||q.documentMessage?.caption||q.imageMessage?.caption||q.videoMessage?.caption||''; }
function extractRawText(msg){ const x=msg?.message||{}; return x.conversation||x.extendedTextMessage?.text||x.documentMessage?.caption||x.imageMessage?.caption||x.videoMessage?.caption||''; }
async function download(m,target){ return m.download(target); }
async function ocrMessage(m,target){
  const buffer=await download(m,target); const worker=await createWorker('eng');
  try { const {data}=await worker.recognize(buffer); return data?.text||''; } finally { await worker.terminate(); }
}
async function documentText(m,target){
  const buffer=await download(m,target); const type=target?.message?.documentMessage?.mimetype||''; const name=target?.message?.documentMessage?.fileName||'';
  if(type==='text/plain' || /\.txt$/i.test(name)) return buffer.toString('utf8');
  if(type==='application/pdf' || /\.pdf$/i.test(name)) { const result=await pdf(buffer); return result.text||''; }
  throw new Error('Dokumen hanya mendukung PDF atau TXT untuk .addcmd.');
}
