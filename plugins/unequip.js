import { unequipItem, getUserProfile, inventorySummary } from '../lib/gamification.js';
import { renderInventoryCanvas } from '../services/canvas.js';
export default { name:'unequip', version:'15.0.3', usage:'unequip <nomor|id>', help:'Lepas equipment', async execute({m,args}){try{const x=await unequipItem(m,args[0]);const u=getUserProfile(m);const image=await renderInventoryCanvas(u,inventorySummary(m));return m.reply({image,caption:`*NEXORA UNEQUIP*\n${x.name} dilepas.\nSlot: ${u.equipped.length}/3`});}catch(e){return m.reply({text:`Unequip gagal: ${e.message}`});}}};
