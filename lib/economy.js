import crypto from 'node:crypto';
import { getState, persistGamification } from './state.js';
import { getUserProfile, userKey } from './gamification.js';
export async function transferCoins(fromMessage,toRef,amount){
 const amountInt=Math.floor(Number(amount)); if(!Number.isFinite(amountInt)||amountInt<=0) throw new Error('Jumlah coin tidak valid.');
 const from=getUserProfile(fromMessage); const users=getState().users; const toKey=String(toRef||'').toLowerCase(); const to=users[toKey];
 if(!to) throw new Error('Penerima belum memiliki profile NEXORA.'); if(from.id===to.id) throw new Error('Tidak dapat transfer ke diri sendiri.'); if(from.coins<amountInt) throw new Error('Coin tidak cukup.');
 from.coins-=amountInt; to.coins+=amountInt; const tx={id:crypto.randomUUID(),from:from.id,to:to.id,amount:amountInt,at:new Date().toISOString()}; getState().transactions.push(tx); getState().transactions=getState().transactions.slice(-1000); await persistGamification(); return tx;
}
export function economyHistory(m,limit=10){const id=userKey(m);return getState().transactions.filter(x=>x.from===id||x.to===id).slice(-limit).reverse();}
export async function dailyClaim(m){const u=getUserProfile(m);const d=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());const s=getState();s.daily ||= {};const k=u.id;if(s.daily[k]===d) throw new Error('Daily reward sudah diambil hari ini.');const coins=100+u.level*10;const xp=50+u.level*5;u.coins+=coins;u.xp+=xp;s.daily[k]=d;await persistGamification();return {coins,xp,date:d};}
