import { startBattle, battleSnapshot, ENEMIES } from '../lib/rpg.js';
import { renderBattleProofCanvas } from '../services/canvas.js';

const enemyRows = (prefix) => Object.values(ENEMIES).filter(e=>e.level<=20).slice(0,6).map(e=>({
  header:'Enemy', title:`${prefix}battle ${e.id}`, description:`${e.name} • Lv.${e.level} • HP ${e.hp}`,
  id:`${prefix}battle ${e.id}`
}));

export default {name:'battle',version:'15.0.3',aliases:['fight','combat'],usage:'battle <enemy>|battle status',category:'game.combat',help:'Pilih atau mulai pertarungan PvE; status menampilkan HUD battle',async execute({m,args,prefix}){
  try{
    const a=(args[0]||'').toLowerCase();
    if(a==='status'){
      const s=battleSnapshot(m); if(!s.active)return m.reply({text:`Tidak ada battle aktif.\nGunakan ${prefix}battle untuk memilih musuh.`});
      const image=await renderBattleProofCanvas(s,'ongoing');
      return m.sendInteractive({title:'NEXORA BATTLE',subtitle:'Combat HUD',body:`*BATTLE HUD v15.0.3*\nEnemy: ${s.enemy.name} • Lv.${s.enemy.level}\nTurn: ${s.turn}\n\nHP ${s.character.hp}/${s.character.maxHp} • MP ${s.character.mp}/${s.character.maxMp}\nEnemy HP ${s.enemyState.hp}/${s.enemy.maxHp}\n\nPilih aksi:`,footer:'NEXORA RPG',image,buttons:[{name:'quick_reply',title:'Attack',id:`${prefix}skill basic`},{name:'quick_reply',title:'Power',id:`${prefix}skill power`},{name:'quick_reply',title:'Skills',id:`${prefix}skill`} ]});
    }
    if(!a){
      const sections=[{title:'Enemy Selection',highlight_label:'Pilih Target',rows:enemyRows(prefix)}];
      return m.sendInteractive({title:'NEXORA BATTLE',subtitle:'PvE Enemy Selection',body:'*BATTLE GATE v15.0.3*\nBelum ada musuh dipilih.\n\nTekan tombol *Pilih Musuh* lalu pilih salah satu enemy.',footer:'NEXORA RPG • Native Flow',buttons:[{name:'single_select',title:'Pilih Musuh',sections}]});
    }
    if(!ENEMIES[a])throw new Error(`Enemy ID tidak dikenal: ${a}. Gunakan ${prefix}battle.`);
    const s=await startBattle(m,a);const image=await renderBattleProofCanvas(s,'ongoing');
    return m.sendInteractive({title:'NEXORA BATTLE',subtitle:`${s.enemy.name} • Lv.${s.enemy.level}`,body:`*BATTLE START v15.0.3*\nHP ${s.enemyState.hp}/${s.enemy.maxHp}\nMP ${s.enemyState.mp}/${s.enemy.maxMp}\n\nTurn ${s.turn}: pilih aksi.`,footer:'NEXORA RPG',image,buttons:[{name:'quick_reply',title:'Attack',id:`${prefix}skill basic`},{name:'quick_reply',title:'Power Strike',id:`${prefix}skill power`},{name:'quick_reply',title:'Guard',id:`${prefix}skill guard`}]});
  }catch(e){return m.reply({text:`Battle gagal: ${e.message}`})}
}};
