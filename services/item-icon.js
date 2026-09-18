import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { askAI } from './ai.js';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const safeSvg=s=>{const x=String(s||'').trim().replace(/^```(?:svg|xml)?/i,'').replace(/```$/,'').trim();return x.startsWith('<svg')&&x.includes('</svg>')&&!/<script|foreignObject|on[a-z]+\s*=|javascript:/i.test(x)?x:null;};
function deterministic(item){const labels={common:'C',rare:'R',epic:'E',mythic:'M',legendary:'L'};const r=labels[item.rarity]||'N';return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#172033"/><stop offset="1" stop-color="#34405c"/></linearGradient></defs><rect x="8" y="8" width="240" height="240" rx="52" fill="url(#g)" stroke="#8be9fd" stroke-width="5"/><circle cx="128" cy="105" r="55" fill="none" stroke="#f8f9ff" stroke-width="8"/><path d="M92 118h72M105 88h46" stroke="#8be9fd" stroke-width="9" stroke-linecap="round"/><text x="128" y="205" text-anchor="middle" fill="#f8f9ff" font-family="Arial" font-size="28" font-weight="700">${esc(r)}</text></svg>`;}
export async function ensureItemIcon(item){await fs.mkdir('./data/item-icons',{recursive:true});const base=String(item.id||item.name).replace(/[^a-z0-9_-]/gi,'_').toLowerCase();const svgPath=path.resolve('./data/item-icons',`${base}.svg`),pngPath=path.resolve('./data/item-icons',`${base}.png`);let svg;
try{svg=safeSvg(await fs.readFile(svgPath,'utf8'));}catch{}
if(!svg){try{const prompt=`Create ONLY a safe standalone SVG icon, 256x256, no script, no foreignObject, for this game item: ${item.name}; rarity ${item.rarity}; type ${item.type}; effect ${item.effect}. Use a clean futuristic NEXORA game UI style.`;const r=await askAI(prompt);svg=safeSvg(r?.text);}catch{}}
if(svg){await fs.writeFile(svgPath,svg);try{await sharp(Buffer.from(svg)).png().toFile(pngPath);return {svg:svgPath,png:pngPath,mode:'ai-svg'};}catch{}}
const fallback=deterministic(item);await fs.writeFile(svgPath,fallback);await sharp(Buffer.from(fallback)).png().toFile(pngPath);return {svg:svgPath,png:pngPath,mode:'deterministic-png'};}
