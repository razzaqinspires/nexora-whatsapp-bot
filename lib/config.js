import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeJid } from './security.js';

dotenv.config({ path: process.env.NEXORA_ENV_FILE || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const bool=(v,f=false)=>v==null||v===''?f:['1','true','yes','on'].includes(String(v).toLowerCase());
const csv=v=>String(v||'').split(',').map(s=>s.trim()).filter(Boolean);
const num=(v,f,min=-Infinity,max=Infinity)=>{const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:f;};
const endpoint=(url,mode='responses')=>{const raw=String(url||'').trim().replace(/\/+$/,'');if(!raw)return '';if(/\/(responses|chat\/completions)$/i.test(raw))return raw;return `${raw}/${mode==='chat'?'chat/completions':'responses'}`;};
function parseAiProviders(){
  const out=[];
  if(process.env.AI_PROVIDERS_JSON){try{const parsed=JSON.parse(process.env.AI_PROVIDERS_JSON);if(Array.isArray(parsed))out.push(...parsed);}catch{}}
  for(let i=1;i<=12;i++){
    const key=process.env[`AI_API_${i}_KEY`];
    const base=process.env[`AI_API_${i}_BASE_URL`];
    const model=process.env[`AI_API_${i}_MODEL`];
    if(key||base||model) out.push({id:`env-${i}`,name:process.env[`AI_API_${i}_NAME`]||`provider-${i}`,apiKey:key,baseUrl:base,model,apiMode:process.env[`AI_API_${i}_MODE`]||'responses',priority:num(process.env[`AI_API_${i}_PRIORITY`],i,1,100),weight:num(process.env[`AI_API_${i}_WEIGHT`],1,1,100),enabled:bool(process.env[`AI_API_${i}_ENABLED`],true),rpm:num(process.env[`AI_API_${i}_RPM`],0,0,100000),tpm:num(process.env[`AI_API_${i}_TPM`],0,0,100000000)});
  }
  if(!out.length && (process.env.AI_API_KEY||process.env.AI_BASE_URL||process.env.AI_MODEL)) out.push({id:'primary',name:'primary',apiKey:process.env.AI_API_KEY,baseUrl:process.env.AI_BASE_URL,model:process.env.AI_MODEL,apiMode:process.env.AI_API_MODE||'responses',priority:1,weight:1,enabled:true,rpm:num(process.env.AI_RPM,0),tpm:num(process.env.AI_TPM,0)});
  return out.map((p,i)=>({...p,id:p.id||`provider-${i+1}`,name:p.name||p.id||`provider-${i+1}`,apiMode:['chat','responses'].includes(String(p.apiMode||'responses').toLowerCase())?String(p.apiMode||'responses').toLowerCase():'responses',endpoint:endpoint(p.endpoint||p.baseUrl,p.apiMode),priority:num(p.priority,i+1,1,100),weight:num(p.weight,1,1,100),enabled:p.enabled!==false,rpm:num(p.rpm,0,0,100000),tpm:num(p.tpm,0,0,100000000)}));
}
const authMode=String(process.env.AUTH_MODE||'qr').toLowerCase(); const accessMode=String(process.env.BOT_ACCESS_MODE||'public').toLowerCase();
export const config={
 version:'15.0.3',
 prefix:process.env.BOT_PREFIX||'/',
 prefixMode:['single','multi','none'].includes(String(process.env.BOT_PREFIX_MODE||'single').toLowerCase())?String(process.env.BOT_PREFIX_MODE||'single').toLowerCase():'single',
 timezone:process.env.NEXORA_TIMEZONE||'Asia/Jakarta',
 accessMode:['public','self'].includes(accessMode)?accessMode:'public',
 reconnect:{enabled:bool(process.env.RECONNECT_ENABLED,true),initialDelay:num(process.env.RECONNECT_INITIAL_DELAY_MS,3000,250,120000),maxDelay:num(process.env.RECONNECT_MAX_DELAY_MS,60000,1000,600000),maxAttempts:num(process.env.RECONNECT_MAX_ATTEMPTS,20,0,1000)},
 auth:{mode:['qr','pairing'].includes(authMode)?authMode:'qr',pairingPhone:String(process.env.PAIRING_PHONE||'').replace(/\D/g,''),authDir:process.env.AUTH_DIR||'./auth'},
 security:{ownerJids:new Set(csv(process.env.OWNER_JIDS).map(normalizeJid)),adminJids:new Set(csv(process.env.ADMIN_JIDS).map(normalizeJid)),blockJids:new Set(csv(process.env.BLOCK_JIDS).map(normalizeJid)),rateLimitMax:num(process.env.RATE_LIMIT_MAX,15,1,1000),premiumRateLimitMax:num(process.env.PREMIUM_RATE_LIMIT_MAX,40,1,5000),rateLimitWindowMs:num(process.env.RATE_LIMIT_WINDOW_MS,10000,100,3600000),commandCooldownMs:num(process.env.COMMAND_COOLDOWN_MS,500,0,60000),maxCommandLength:num(process.env.MAX_COMMAND_LENGTH,4000,50,20000),maintenanceDefault:bool(process.env.MAINTENANCE_MODE,false),allowSelfCommands:bool(process.env.ALLOW_SELF_COMMANDS,true),audit:bool(process.env.AUDIT_LOG,true),allowGroups:bool(process.env.ALLOW_GROUPS,true),allowPrivate:bool(process.env.ALLOW_PRIVATE,true)},
 ai:{providers:parseAiProviders(),defaultMode:String(process.env.AI_API_MODE||'responses'),timeoutMs:num(process.env.AI_TIMEOUT_MS,30000,1000,180000),temperature:num(process.env.AI_TEMPERATURE,0.7,0,2),retries:num(process.env.AI_RETRIES,1,0,5),cooldownMs:num(process.env.AI_PROVIDER_COOLDOWN_MS,30000,1000,3600000),maxContext:num(process.env.AI_MAX_CONTEXT,12,2,50)},
 automation:{slots:csv(process.env.NEXORA_SLOTS||'09:00,13:00,19:00'),autoUploadDefault:bool(process.env.NEXORA_AUTOUPLOAD,false),maxDailyPosts:num(process.env.NEXORA_MAX_DAILY_POSTS,3,1,100),retryAttempts:num(process.env.NEXORA_JOB_RETRIES,3,0,10),cooldownMinutes:num(process.env.NEXORA_JOB_COOLDOWN_MIN,5,0,1440)},
 downloader:{binary:process.env.YTDLP_BIN||'yt-dlp',ffmpeg:process.env.FFMPEG_BIN||'ffmpeg',maxFileSizeMb:num(process.env.DOWNLOAD_MAX_MB,80,5,2048),timeoutMs:num(process.env.DOWNLOAD_TIMEOUT_MS,120000,5000,600000),tempDir:process.env.DOWNLOAD_TEMP_DIR||'./downloads'},
 game:{dailyXpCap:num(process.env.GAME_DAILY_XP_CAP,1000,100,100000),maxEquip:3},
 cache:{dir:process.env.NEXORA_CACHE_DIR||'./data/cache',maxEntries:num(process.env.NEXORA_CACHE_MAX,500,20,10000),ttlMs:num(process.env.NEXORA_CACHE_TTL_MS,86400000,1000,604800000)},
 memory:{dir:process.env.NEXORA_MEMORY_DIR||'./data/memory',compactEvery:num(process.env.NEXORA_MEMORY_COMPACT_EVERY,5000,100,1000000)},
 dryRun:bool(process.env.DRY_RUN,true),
 instagram:{username:process.env.IG_USERNAME||'',password:process.env.IG_PASSWORD||'',sessionFile:process.env.IG_SESSION_FILE||'./auth/instagram-session.json',proxy:process.env.IG_PROXY||'',publishEnabled:bool(process.env.IG_PUBLISH_ENABLED,false)}
};
export function validateConfig(){const w=[];if(!config.security.ownerJids.size)w.push('OWNER_JIDS kosong.');if(!config.ai.providers.length)w.push('AI provider belum dikonfigurasi.');else if(config.ai.providers.every(p=>!p.apiKey||!p.endpoint||!p.model))w.push('AI provider ditemukan tetapi credential/endpoint/model belum lengkap.');if(!config.instagram.username||!config.instagram.password)w.push('Instagram credentials belum lengkap.');if(!config.dryRun)w.push('DRY_RUN=false: upload dapat publish sungguhan.');return w;}
