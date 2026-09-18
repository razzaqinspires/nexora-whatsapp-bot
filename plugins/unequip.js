import { unequipItem, getUserProfile, inventorySummary } from '../lib/gamification.js';
import { renderInventoryCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';
export default {name:'unequip',version:'17.0.0',usage:'unequip <nomor|id>',category:'game.character',help:'Lepas equipment',async execute({m,args,prefix}){try{const x=await unequipItem(m,args[0]);const u=getUserProfile(m),image=await renderInventoryCanvas(u,inventorySummary(m));return sendRpgScreen(m,{title:'NEXORA EQUIPMENT',subtitle:'Equipment updated',body:`*UNEQUIP v17*
${x.name} dilepas.
Slot ${u.equipped.length}/3`,image,buttons:[quick(`${prefix}inventory`,'Inventory'),quick(`${prefix}equip`,'Equip'),quick(`${prefix}character`,'Character')],footer:'NEXORA RPG • Equipment'});}catch(e){return m.reply({text:`Unequip gagal: ${e.message}`});}}};
