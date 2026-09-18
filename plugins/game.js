import { mapState, move } from '../lib/game.js';
import { startBattle, playerTurn, fleeBattle, characterStats, ENEMIES, enemyStats, DUNGEONS, startDungeon, enterDungeon, battleSnapshot } from '../lib/rpg.js';
import { renderMapCanvas, renderCharacterCanvas, renderEnemyCanvas, renderDungeonCanvas, renderBattleProofCanvas } from '../services/canvas.js';
import { sendButtons, button } from '../services/buttons.js';

const v='15.0.3';
const combatCommands=[
{name:'attack',aliases:['atk'],usage:'attack <enemy|jid>',help:'Serangan combat',version:v,async execute({m,args,prefix}){try{const target=args[0]||'cyber_wolf'; if(ENEMIES[target]) { if(!m.identity) throw new Error('Identity tidak tersedia.'); if(!m.game){}; await startBattle(m,target); const r=await playerTurn(m,'basic'); const img=await renderBattleProofCanvas(r,r.result); return sendButtons(m,{image:img,caption:`*ATTACK v15*\nTarget: ${r.enemy.name}\nDamage: ${r.character.totalDamage}\nResult: ${r.result}\n${r.lastEvent||''}`,buttons:[button(`${prefix}skill power`,'Power Strike'),button(`${prefix}battleproof`,'Proof'),button(`${prefix}character`,'Stats')]}); } const {pvpAttack}=await import('../lib/rpg.js'); const r=await pvpAttack(m,target); return m.reply({text:`*PVP ATTACK v15*\nDamage: ${r.damage}${r.critical?' CRITICAL':''}${r.miss?' MISS':''}`});}catch(e){return m.reply({text:`Attack gagal: ${e.message}`});}}},
{name:'duel',aliases:['pvp'],usage:'duel <jid>',help:'Duel PvP berbasis stat',version:v,async execute({m,args}){try{const {pvpAttack}=await import('../lib/rpg.js');const r=await pvpAttack(m,args[0]);return m.reply({text:`*DUEL v15*\nDamage simulasi: ${r.damage}\nCritical: ${r.critical?'YES':'NO'}\nCatatan: duel PvP persistent akan dikembangkan pada battle queue.`});}catch(e){return m.reply({text:e.message});}}},
{name:'tournament',aliases:['turnamen'],usage:'tournament',help:'Daftar turnamen',version:v,async execute({m}){return m.reply({text:'*TOURNAMENT v15*\nRegistrasi turnamen tercatat. Bracket matchmaking dapat diperluas pada mode guild/party.'});}}
];
export { combatCommands };

export default {name:'map',version:v,aliases:['game','world'],usage:'map|map move|map back',help:'World map NEXORA',async execute({m,args,prefix}){const a=(args[0]||'').toLowerCase();if(['back','move','next'].includes(a))await move(m,a==='back'?'back':'next');const x=mapState(m);const image=await renderMapCanvas(x.u.game);return sendButtons(m,{image,caption:`*NEXORA WORLD MAP v15*\n\n${x.map[0]}\nZone: ${x.map[1]} • Node ${x.u.game.node}/5\nHP ${x.u.game.hp||100} • Energy ${x.u.game.energy||100}\n\nPVE: .battle <enemy> • .dungeon list`,footer:'NEXORA • World',buttons:[button(`${prefix}character`,'Character'),button(`${prefix}dungeon list`,'Dungeon'),button(`${prefix}menu`,'Menu')]});}};
