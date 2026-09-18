import { fleeBattle } from '../lib/rpg.js';
import { renderBattleProofCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';
export default {name:'flee',version:'17.0.0',aliases:['run'],usage:'flee',category:'game.combat',help:'Kabur dari battle aktif',async execute({m,prefix}){try{const b=await fleeBattle(m);const image=await renderBattleProofCanvas(b,'fled');return sendRpgScreen(m,{title:'NEXORA BATTLE',subtitle:'Encounter ended',body:`*FLEE v17*
Kamu meninggalkan pertarungan.

Last event: ${b.lastEvent||'Fled'}`,image,buttons:[quick(`${prefix}battle`,'🔥 New Battle'),quick(`${prefix}character`,'Character'),quick(`${prefix}menu game`,'RPG Menu')],footer:'NEXORA RPG • Battle Exit'});}catch(e){return m.reply({text:e.message});}}};
