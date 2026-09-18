import fs from 'node:fs/promises';
import path from 'node:path';
import makeWASocket, { Browsers, DisconnectReason, makeCacheableSignalKeyStore, useMultiFileAuthState } from '@whiskeysockets/baileys';
import P from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { getState, persistJadibot } from '../lib/state.js';

const sessions=new Map();
let globalHandler=null;
export function setJadibotHandler(fn){ globalHandler=typeof fn==='function'?fn:null; }
const logger=P({level:'silent'});
const base=process.env.JADIBOT_AUTH_DIR||'./auth/jadibot';
const maxMs=Number(process.env.JADIBOT_MAX_DAYS||30)*86400000;

export function jadibotStatus(jid){ const s=sessions.get(jid); if(!s)return getState().jadibots?.[jid]||null; return {...s,connected:Boolean(s.connected),authDir:undefined}; }
export function allJadibotStatus(){return Object.entries(getState().jadibots||{}).map(([owner,v])=>({owner,...v,live:sessions.has(owner)}));}
export async function startJadibot({jid,phone,days=7,onMessage}={}){
  if(!jid)throw new Error('JID owner wajib.');
  if(!isPremium(jid,{})) throw new Error('Fitur jadibot khusus premium.');
  if(sessions.has(jid)) return jadibotStatus(jid);
  days=Math.max(1,Math.min(Number(days)||7,Math.floor(maxMs/86400000)));
  const expiresAt=new Date(Date.now()+days*86400000).toISOString();
  const authDir=path.resolve(base,Buffer.from(jid).toString('hex'));
  await fs.mkdir(authDir,{recursive:true});
  const {state,saveCreds}=await useMultiFileAuthState(authDir);
  const sock=makeWASocket({auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,logger)},logger,browser:Browsers.ubuntu('Chrome'),markOnlineOnConnect:false,syncFullHistory:false});
  const rec={owner:jid,createdAt:new Date().toISOString(),expiresAt,connected:false,botJid:null,authDir}; sessions.set(jid,{...rec,sock});
  await persistJadibot(jid,{...rec});
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('connection.update',async ({connection,lastDisconnect,qr})=>{
    const s=sessions.get(jid); if(!s)return;
    if(qr){ console.log(`[JADIBOT ${jid}] QR available; scan from terminal if needed.`); qrcode.generate(qr,{small:true}); }
    if(connection==='open'){s.connected=true;s.botJid=sock.user?.id||null;await persistJadibot(jid,{...s,authDir:undefined});}
    if(connection==='close'){
      s.connected=false;
      const code=new Boom(lastDisconnect?.error)?.output?.statusCode;
      if(code===DisconnectReason.loggedOut || Date.now()>=new Date(expiresAt).getTime()){sessions.delete(jid);await persistJadibot(jid,null);}
    }
  });
  sock.ev.on('messages.upsert', async ({messages,type})=>{
    if(type!=='notify'||!(onMessage||globalHandler))return;
    const s=sessions.get(jid); if(!s)return;
    if(Date.now()>=new Date(s.expiresAt).getTime()){try{await sock.logout();}catch{} sessions.delete(jid);await persistJadibot(jid,null);return;}
    for(const msg of messages||[]) try{await (onMessage||globalHandler)({sock,msg,ownerJid:jid});}catch(e){console.error('[JADIBOT]',e.message)}
  });
  if(phone && !state.creds.registered){ const clean=String(phone).replace(/\D/g,''); if(!clean)throw new Error('Nomor pairing tidak valid.'); const code=await sock.requestPairingCode(clean); sessions.get(jid).pairingCode=code; }
  return jadibotStatus(jid);
}
export async function stopJadibot(jid){const s=sessions.get(jid);if(s?.sock){try{await s.sock.logout();}catch{}}sessions.delete(jid);await persistJadibot(jid,null);return true;}
