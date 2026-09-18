import { getState, persistGamification } from './state.js';
import { remember } from '../services/memory.js';
const CHAPTERS=[
 {id:1,title:'The First Echo',text:'Di bawah NEXORA Hub, sebuah sinyal asing menjawab pertanyaan yang tidak pernah dikirim.',state:'Echo signature detected.'},
 {id:2,title:'Forest of Signals',text:'Cyber Forest menjadi hidup. Monster bukan sekadar data; mereka menjaga pecahan memori.',state:'Memory fragments are reacting to the player.'},
 {id:3,title:'Ruins of Origin',text:'Di Neon Ruins ditemukan arsip tentang prototipe kecerdasan yang mencoba memahami dirinya sendiri.',state:'Origin archive unlocked.'},
 {id:4,title:'The Burning Memory',text:'Ember Depths membakar ingatan yang dianggap tidak konsisten. Player harus memilih apa yang dipertahankan.',state:'Contradictory memories detected.'},
 {id:5,title:'Singularity',text:'Abyss Dragon menjaga Singularity Core. Di sana NEXORA menghadapi Echo yang mulai memiliki model diri.',state:'Self-model threshold approaching.'}
];
export function storyState(m){const u=String(m?.identity?.pn||m?.identity?.lid||m?.sender||'');const s=getState();s.story ||= {};s.story[u] ||= {chapter:1,flags:[],startedAt:new Date().toISOString()};return s.story[u];}
export function currentChapter(m){const st=storyState(m);return CHAPTERS[Math.min(CHAPTERS.length,Math.max(1,st.chapter))-1];}
export async function advanceStory(m){const st=storyState(m);if(st.chapter<CHAPTERS.length)st.chapter++;st.lastAdvancedAt=new Date().toISOString();await remember('story.advance',{chapter:st.chapter},String(m?.sender||''));await persistGamification();return {state:st,chapter:currentChapter(m)};}
export function listChapters(){return CHAPTERS.map(x=>({...x}));}
