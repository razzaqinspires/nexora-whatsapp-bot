import { startBattle, battleSnapshot, ENEMIES, characterStats } from '../lib/rpg.js';
import { renderBattleProofCanvas, renderBattleSelectionCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';

const available=()=>Object.values(ENEMIES).filter(e=>e.level<=20);
const selectionSections=(prefix)=>[{title:'Enemy Selection',highlight_label:'Pilih Target',rows:available().map(e=>({header:e.type.toUpperCase(),title:`${prefix}battle ${e.id}`.slice(0,24),description:`${e.name} • Lv.${e.level} • HP ${e.hp} • ${e.xp} XP`,id:`${prefix}battle ${e.id}`}))}];
const actionButtons=(prefix)=>[quick(`${prefix}skill basic`,'⚔ Attack'),quick(`${prefix}skill`,'✨ Skills'),quick(`${prefix}flee`,'🏃 Flee')];

export default {name:'battle',version:'17.0.0',aliases:['fight','combat'],usage:'battle [enemy]|battle status',category:'game.combat',help:'Battle PvE dengan visual canvas, native selection dan combat HUD',async execute({m,args,prefix}){
 try{
  const a=String(args[0]||'').toLowerCase();
  if(a==='status'){
   const s=battleSnapshot(m); if(!s.active)return m.reply({text:`Tidak ada battle aktif.\nGunakan ${prefix}battle untuk memilih musuh.`});
   const image=await renderBattleProofCanvas(s,'ongoing');
   return sendRpgScreen(m,{title:'NEXORA BATTLE',subtitle:`${s.enemy.name} • Lv.${s.enemy.level}`,body:`*BATTLE HUD v17*\nTurn ${s.turn}\n\nHP ${s.character.hp}/${s.character.maxHp} • MP ${s.character.mp}/${s.character.maxMp}\nEnemy HP ${s.enemyState.hp}/${s.enemy.maxHp}\n\n${s.lastEvent||'Pilih aksi.'}`,image,buttons:actionButtons(prefix),footer:'NEXORA RPG • Combat HUD v17'});
  }
  if(!a){
   const image=await renderBattleSelectionCanvas(available(),characterStats(m));
   return sendRpgScreen(m,{title:'NEXORA BATTLE',subtitle:'PvE Enemy Selection',body:'*BATTLE GATE v17*\nPilih musuh untuk memulai encounter.\n\nSetiap pilihan akan membuka HUD battle dengan aksi native.',image,sections:selectionSections(prefix),listTitle:'🔥 Pilih Musuh',buttons:[quick(`${prefix}character`,'Character'),quick(`${prefix}map`,'World Map')],footer:'NEXORA RPG • Visual Battle Gate'});
  }
  if(!ENEMIES[a])throw new Error(`Enemy ID tidak dikenal: ${a}`);
  const s=await startBattle(m,a), image=await renderBattleProofCanvas(s,'ongoing');
  return sendRpgScreen(m,{title:'NEXORA BATTLE',subtitle:`${s.enemy.name} • Lv.${s.enemy.level}`,body:`*BATTLE START v17*\nEncounter terkunci.\n\nTurn ${s.turn} • HP ${s.enemyState.hp}/${s.enemy.maxHp}\nPilih aksi dari tombol di bawah.`,image,buttons:actionButtons(prefix),footer:'NEXORA RPG • Combat Engine v17'});
 }catch(e){return m.reply({text:`Battle gagal: ${e.message}`})}
}};
