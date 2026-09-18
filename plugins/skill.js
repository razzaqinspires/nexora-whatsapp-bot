import { playerTurn, battleSnapshot, SKILL_BOOK } from '../lib/rpg.js';
import { renderBattleProofCanvas } from '../services/canvas.js';
import { sendButtons, button } from '../services/buttons.js';

const ORDER=['basic','power','arcane','guard','lifeburst','venom','inferno','frost','drain','haste','lifesteal'];
export default {name:'skill',version:'15.0.3',aliases:['cast'],usage:'skill <id>',category:'game.combat',help:'Gunakan skill combat; tanpa argumen menampilkan skill yang tersedia',async execute({m,args,prefix}){
  try {
    const snap=battleSnapshot(m);
    if(!snap.active) return m.reply({text:`*SKILL BOOK v15*\nTidak ada battle aktif.\n\nGunakan ${prefix}battle untuk memilih musuh.`});
    const id=String(args[0]||'').toLowerCase();
    if(!id){
      const lines=ORDER.map((k,i)=>{const s=SKILL_BOOK[k];return `${i+1}. ${prefix}skill ${k} — ${s.name} • MP ${s.cost} • CD ${s.cd}`;});
      return sendButtons(m,{text:`*SKILL BOOK v15*\n${snap.enemy.name} • Turn ${snap.turn}\n\n${lines.join('\n')}`,buttons:[button(`${prefix}skill basic`,'Basic'),button(`${prefix}skill power`,'Power'),button(`${prefix}battle status`,'Status')]});
    }
    if(!SKILL_BOOK[id]) return m.reply({text:`Skill tidak dikenal: ${id}\nGunakan ${prefix}skill untuk melihat Skill Book.`});
    const r=await playerTurn(m,id); const image=await renderBattleProofCanvas(r,r.result); const next=r.result==='ongoing';
    return sendButtons(m,{image,caption:`*COMBAT TURN v15*\n${r.enemy.name} • Turn ${r.turn}\n${r.lastEvent}\n\nPlayer HP ${r.character.hp}/${r.character.maxHp} • MP ${r.character.mp}/${r.character.maxMp}\nEnemy HP ${r.enemyState.hp}/${r.enemy.maxHp}\nResult: ${r.result}${r.reward?`\nReward: +${r.reward.xp} XP • +${r.reward.coins} coins • ${r.reward.drop}`:''}`,buttons:next?[button(`${prefix}skill basic`,'Attack'),button(`${prefix}skill power`,'Power'),button(`${prefix}skill guard`,'Guard')]:[button(`${prefix}battle ${r.enemy.id}`,'Retry'),button(`${prefix}character`,'Character'),button(`${prefix}menu game`,'Game')]});
  } catch(e){ return m.reply({text:`Skill gagal: ${e.message}`}); }
}};
