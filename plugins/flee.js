import { fleeBattle } from '../lib/rpg.js';
export default {name:'flee',version:'15.0.3',aliases:['run'],usage:'flee',help:'Kabur dari battle aktif',async execute({m}){try{const b=await fleeBattle(m);return m.reply({text:`*FLEE v15*\nBattle ${b.id.slice(0,8)} dihentikan.`});}catch(e){return m.reply({text:e.message});}}};
