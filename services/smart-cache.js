import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const dir = process.env.NEXORA_CACHE_DIR || './data/cache';
const maxEntries = Number(process.env.NEXORA_CACHE_MAX || 500);
const ttlMs = Number(process.env.NEXORA_CACHE_TTL_MS || 86400000);
const mem = new Map();
let initialized = false;

async function init() { if (!initialized) { await fs.mkdir(dir, { recursive: true }); initialized = true; } }
function fileFor(key) { const h=crypto.createHash('sha256').update(String(key)).digest('hex'); return path.join(dir, `${h}.json`); }
function touch(key, value, ttl=ttlMs) { if (mem.has(key)) mem.delete(key); mem.set(key,{value,expiresAt:Date.now()+ttl,last:Date.now()}); while(mem.size>maxEntries) mem.delete(mem.keys().next().value); }
export async function cacheGet(key) { await init(); const hit=mem.get(key); if(hit){if(hit.expiresAt>Date.now()){hit.last=Date.now();return hit.value;}mem.delete(key);} try{const x=JSON.parse(await fs.readFile(fileFor(key),'utf8')); if(x.expiresAt>Date.now()){touch(key,x.value,Math.max(1000,x.expiresAt-Date.now()));return x.value;} await fs.rm(fileFor(key),{force:true});}catch{} return undefined; }
export async function cacheSet(key,value,ttl=ttlMs){await init();touch(key,value,ttl);await fs.writeFile(fileFor(key),JSON.stringify({expiresAt:Date.now()+ttl,value}));return value;}
export async function cacheGetOrSet(key,producer,ttl=ttlMs){const hit=await cacheGet(key);if(hit!==undefined)return hit;const value=await producer();return cacheSet(key,value,ttl);}
export async function cacheDelete(key){await init();mem.delete(key);await fs.rm(fileFor(key),{force:true});}
export async function cacheClear(){await init();mem.clear();const files=await fs.readdir(dir);await Promise.all(files.filter(x=>x.endsWith('.json')).map(x=>fs.rm(path.join(dir,x),{force:true})));}
export function cacheStats(){return {memoryEntries:mem.size,maxEntries,ttlMs,dir};}
