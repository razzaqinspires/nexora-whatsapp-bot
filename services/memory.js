import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const dir=process.env.NEXORA_MEMORY_DIR||'./data/memory';
const file=path.join(dir,'events.jsonl');
const snap=path.join(dir,'snapshot.json');
let chain=Promise.resolve();
async function init(){await fs.mkdir(dir,{recursive:true});}
function id(){return crypto.randomUUID();}
export async function remember(type,data={},actor=null){await init();const event={id:id(),ts:new Date().toISOString(),type,actor,data};chain=chain.then(()=>fs.appendFile(file,JSON.stringify(event)+'\n'));await chain;return event;}
export async function readMemory({actor,type,since,limit=100}={}){await init();let text='';try{text=await fs.readFile(file,'utf8');}catch{return [];}const out=[];for(const line of text.split('\n')){if(!line)continue;try{const e=JSON.parse(line);if(actor&&e.actor!==actor)continue;if(type&&e.type!==type)continue;if(since&&e.ts<since)continue;out.push(e);}catch{}}return out.slice(-Math.min(1000,Math.max(1,limit)));}
export async function compactMemory(){await init();const events=await readMemory({limit:100000});const summary={version:"17.0.0",compactedAt:new Date().toISOString(),events:events.length,lastEvent:events.at(-1)?.ts||null,types:{}};for(const e of events)summary.types[e.type]=(summary.types[e.type]||0)+1;await fs.writeFile(snap,JSON.stringify(summary,null,2));return summary;}
export async function memoryStats(){await init();let size=0;try{size=(await fs.stat(file)).size;}catch{}return {file,bytes:size,events:(await readMemory({limit:100000})).length,snapshot:snap};}
