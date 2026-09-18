import crypto from 'node:crypto';
import { getState, persistGamification } from './state.js';
import { getUserProfile, userKey, awardItem } from './gamification.js';
const TEMPLATES=[
 {id:'daily-command',name:'Daily Operator',desc:'Jalankan 10 command.',target:10,rewardXp:120,rewardCoins:75},
 {id:'daily-ai',name:'AI Explorer',desc:'Gunakan NEXORA AI 3 kali.',target:3,rewardXp:150,rewardCoins:100},
 {id:'weekly-duel',name:'Arena Challenger',desc:'Menangkan 3 duel.',target:3,rewardXp:400,rewardCoins:300}
];
function key(m){return userKey(m)}
export function questList(m){const s=getState();s.quests ||= {}; const k=key(m);s.quests[k] ||= {};return TEMPLATES.map(t=>({...t,progress:Number(s.quests[k][t.id]?.progress||0),claimed:Boolean(s.quests[k][t.id]?.claimed)}));}
export async function progressQuest(m,id,amount=1){const s=getState();s.quests ||= {};const k=key(m);s.quests[k] ||= {};const t=TEMPLATES.find(x=>x.id===id);if(!t)return null;s.quests[k][id] ||= {progress:0,claimed:false};const q=s.quests[k][id];q.progress=Math.min(t.target,q.progress+amount);await persistGamification();return {...t,...q};}
export async function claimQuest(m,id){const list=questList(m);const q=list.find(x=>x.id===id);if(!q)throw new Error('Quest tidak ditemukan.');if(q.claimed||q.progress<q.target)throw new Error('Quest belum selesai atau reward sudah diambil.');const s=getState();s.quests[key(m)][id].claimed=true;const u=getUserProfile(m);u.xp+=q.rewardXp;u.coins+=q.rewardCoins;const item=await awardItem(m,'quest');await persistGamification();return {q,item};}
export function questReset(){return crypto.randomUUID();}
