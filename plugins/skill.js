import { playerTurn, battleSnapshot, SKILL_BOOK } from '../lib/rpg.js';
import { renderBattleProofCanvas, renderSkillBookCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';
const ORDER=['basic','power','arcane','guard','lifeburst','venom','inferno','frost','drain','haste','lifesteal','focus','battlecry','meditate','execute','thunder'];
export default {name:'skill',version:'17.0.0',aliases:['cast','skills'],usage:'skill [id]',category:'game.combat',help:'Skill Codex dan eksekusi combat native',async execute({m,args,prefix}){try{
 const snap=battleSnapshot(m); if(!snap.active)return m.reply({text:`*SKILL CODEX v17*
Tidak ada battle aktif.
Gunakan ${prefix}battle.`});
 const id=String(args[0]||'').toLowerCase();
 if(!id){const skills=ORDER.map(k=>SKILL_BOOK[k]).filter(Boolean);const image=await renderSkillBookCanvas(skills,snap);const sections=[{title:'Combat Skills',rows:skills.map(s=>({header:s.kind.toUpperCase(),title:`${prefix}skill ${ORDER.find(k=>SKILL_BOOK[k]===s)}`.slice(0,24),description:`MP ${s.cost} • CD ${s.cd} • ${s.name}`,id:`${prefix}skill ${ORDER.find(k=>SKILL_BOOK[k]===s)}`}))}];return sendRpgScreen(m,{title:'NEXORA SKILL CODEX',subtitle:`${snap.enemy.name} • Turn ${snap.turn}`,body:`*SKILL CODEX v17*
HP ${snap.character.hp}/${snap.character.maxHp} • MP ${snap.character.mp}/${snap.character.maxMp}

Pilih skill dari list. Setelah dieksekusi, HUD battle diperbarui.`,image,sections,listTitle:'✨ Pilih Skill',buttons:[quick(`${prefix}battle status`,'HUD'),quick(`${prefix}battleproof`,'Proof')],footer:'NEXORA RPG • Native Skill Flow'});}
 if(!SKILL_BOOK[id])return m.reply({text:`Skill tidak dikenal: ${id}
Gunakan ${prefix}skill.`});
 const r=await playerTurn(m,id),image=await renderBattleProofCanvas(r,r.result),next=r.result==='ongoing';
 return sendRpgScreen(m,{title:'NEXORA COMBAT',subtitle:`${r.enemy.name} • Turn ${r.turn}`,body:`*COMBAT TURN v17*
${r.lastEvent}

HP ${r.character.hp}/${r.character.maxHp} • MP ${r.character.mp}/${r.character.maxMp}
Enemy HP ${r.enemyState.hp}/${r.enemy.maxHp}
Result: ${r.result}${r.reward?`
Reward: +${r.reward.xp} XP • +${r.reward.coins} coins • ${r.reward.drop}`:''}`,image,buttons:next?[quick(`${prefix}skill basic`,'⚔ Attack'),quick(`${prefix}skill`,'✨ Skills'),quick(`${prefix}flee`,'🏃 Flee')]:[quick(`${prefix}battle`,'🔥 New Battle'),quick(`${prefix}character`,'Character'),quick(`${prefix}menu game`,'RPG Menu')],footer:'NEXORA RPG • Combat Result v17'});
 }catch(e){return m.reply({text:`Skill gagal: ${e.message}`});}}};
