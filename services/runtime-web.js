import http from 'node:http';
import os from 'node:os';
import { config } from '../lib/config.js';
import { getState } from '../lib/state.js';
import { aiHealth } from '../lib/ai-router.js';
import { runtimeDependencyStatus } from './runtime-deps.js';

let server = null;
const startedAt = Date.now();
function snapshot() {
  const state = getState();
  const memory = process.memoryUsage();
  return {
    ok: true, service: 'NEXORA BOT', version: config.version, uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(), timezone: config.timezone,
    node: process.version, platform: `${process.platform}/${process.arch}`,
    hostname: os.hostname(), pid: process.pid,
    memory: { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal },
    commands: state.stats?.commands || 0, errors: state.stats?.errors || 0,
    ai: aiHealth(), runtimeDependencies: runtimeDependencyStatus()
  };
}
function page() {
  const data = JSON.stringify(snapshot());
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXORA Runtime</title><meta property="og:title" content="NEXORA Runtime"><meta property="og:description" content="Live NEXORA Bot runtime monitor"><meta name="description" content="Live NEXORA Bot runtime monitor"><style>body{font-family:system-ui,sans-serif;max-width:980px;margin:40px auto;padding:0 18px;background:#0b0d10;color:#eef}pre{white-space:pre-wrap;background:#151922;padding:18px;border-radius:14px}small{opacity:.7}</style></head><body><h1>NEXORA Runtime</h1><p>Live runtime monitor • <span id="time"></span></p><pre id="out">${data}</pre><script>async function tick(){try{const r=await fetch('/api/status',{cache:'no-store'});document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2);document.getElementById('time').textContent=new Date().toLocaleTimeString()}catch(e){document.getElementById('out').textContent=String(e)}}tick();setInterval(tick,3000)</script></body></html>`;
}
export function runtimeSnapshot(){return snapshot();}
export function runtimeUrl(){return String(process.env.NEXORA_PUBLIC_URL || `http://127.0.0.1:${process.env.NEXORA_WEB_PORT || 3000}`).replace(/\/$/,'');}
export function startRuntimeWeb() {
  if (server) return server;
  const host = process.env.NEXORA_WEB_HOST || '0.0.0.0';
  const port = Number(process.env.NEXORA_WEB_PORT || 3000);
  server = http.createServer((req,res)=>{
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    res.setHeader('cache-control','no-store');
    if (url.pathname === '/api/status' || url.pathname === '/healthz') { res.setHeader('content-type','application/json'); res.end(JSON.stringify(snapshot())); return; }
    if (url.pathname === '/api/ping') { res.setHeader('content-type','application/json'); res.end(JSON.stringify({ok:true,at:new Date().toISOString(),uptimeMs:Date.now()-startedAt})); return; }
    if (url.pathname === '/') { res.setHeader('content-type','text/html; charset=utf-8'); res.end(page()); return; }
    res.statusCode=404; res.end('Not Found');
  });
  server.listen(port,host);
  server.on('error',e=>console.warn('[RUNTIME WEB]',e.message));
  return server;
}
export function stopRuntimeWeb(){if(server){server.close();server=null;}}
