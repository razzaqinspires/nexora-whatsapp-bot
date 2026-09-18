import { equipItem, getUserProfile, inventorySummary } from '../lib/gamification.js';
import { renderInventoryCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';
export default {name:'equip',version:'17.0.0',usage:'equip <nomor|id>',category:'game.character',help:'Equip item hingga 3 slot',async execute({m,args,prefix}){try{const x=await equipItem(m,args[0]);const u=getUserProfile(m),items=inventorySummary(m),image=await renderInventoryCanvas(u,items);return sendRpgScreen(m,{title:'NEXORA EQUIPMENT',subtitle:`Slot ${u.equipped.length}/3`,body:`*EQUIP v17*
${x.name} [${x.rarity}] aktif.
Effect: ${x.effect}
Expiry: ${x.expiresAt?new Date(x.expiresAt).toLocaleString('id-ID'):'permanent'}`,image,buttons:[quick(`${prefix}inventory`,'Inventory'),quick(`${prefix}unequip`,'Unequip'),quick(`${prefix}character`,'Character')],footer:'NEXORA RPG • Equipment'});}catch(e){return m.reply({text:`Equip gagal: ${e.message}`});}}};
