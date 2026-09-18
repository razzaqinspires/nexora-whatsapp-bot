import { startMario, marioAction, marioSnapshot } from '../lib/mario.js';
import { renderMarioCanvas } from '../services/canvas.js';
import { sendRpgScreen, quick } from '../services/rpg-ui.js';

const actions=p=>[quick(`${p}mario left`,'⬅ Left'),quick(`${p}mario jump`,'🆙 Jump'),quick(`${p}mario right`,'➡ Right')];
export default {name:'mario',version:'17.0.0',aliases:['runner','platformer'],usage:'mario [start|left|right|jump|dash|wait|restart|quit]',category:'game.arcade',help:'NEXORA original live platform runner via AIRich + native buttons',async execute({m,args,prefix}){
 try{
  const a=String(args[0]||'').toLowerCase(); let s;
  if(!a||a==='start') s=await startMario(m); else s=await marioAction(m,a);
  const image=await renderMarioCanvas(s);
  const done=!s.active;
  const body=done?(s.over?`*RUN OVER*\nScore ${s.score} • Coins ${s.coins} • Lives ${s.lives}`:`*RUN COMPLETE*\nScore ${s.score} • Coins ${s.coins}`):`*NEXORA RUNNER v17*\nWorld ${s.world} • ${s.progress}%\nLives ${s.lives} • Score ${s.score} • Coins ${s.coins}\n\nObstacle: ${s.obstacle}\nPilih aksi untuk terus bergerak.`;
  return sendRpgScreen(m,{title:'🍄 NEXORA RUNNER',subtitle:'AIRich Live Platformer',body,image,buttons:done?[quick(`${prefix}mario start`,'🔄 Restart'),quick(`${prefix}menu game`,'🎮 RPG Menu')]:[...actions(prefix),quick(`${prefix}mario dash`,'⚡ Dash')],footer:'NEXORA ARCADE • Original Platform Runner v17'});
 }catch(e){return m.reply({text:`Mario: ${e.message}`});}
}};
