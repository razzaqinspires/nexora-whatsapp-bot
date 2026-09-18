import { readMemory, remember } from '../services/memory.js';
export async function rememberInteraction(m,input,output){const actor=String(m?.identity?.pn||m?.identity?.lid||m?.sender||'');return remember('ai.interaction',{input:String(input).slice(0,2000),output:String(output).slice(0,4000)},actor);}
export async function memoryContext(m,limit=8){const actor=String(m?.identity?.pn||m?.identity?.lid||m?.sender||'');const rows=await readMemory({actor,limit});return rows.map(x=>`${x.type}: ${JSON.stringify(x.data)}`).join('\n');}
