import { useItem, getUserProfile, inventorySummary } from '../lib/gamification.js';
import { renderInventoryCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';
export default {name:'use',version:'17.0.0',usage:'use <nomor|id>',category:'game.character',help:'Gunakan item atau aktifkan buff',async execute({m,args,prefix}){try{const x=await useItem(m,args[0]);const u=getUserProfile(m),image=await renderInventoryCanvas(u,inventorySummary(m));return sendRpgScreen(m,{title:'NEXORA ITEM SYSTEM',subtitle:'Item consumed',body:`*ITEM ACTION v17*
${x.name} digunakan.
Effect: ${x.effect||'-'}${x.profile?`
Level ${x.profile.level} • XP ${x.profile.xp}`:''}`,image,buttons:[quick(`${prefix}inventory`,'Inventory'),quick(`${prefix}gacha`,'Gacha'),quick(`${prefix}profile`,'Profile')],footer:'NEXORA RPG • Item System'});}catch(e){return m.reply({text:`Use gagal: ${e.message}`});}}};
