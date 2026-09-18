import { leaderboard, profilePosition } from '../lib/gamification.js';
import { renderLeaderboardCanvas } from '../services/canvas.js';
import { sendButtons, button } from '../services/buttons.js';
export default { name: 'leaderboard', version: '15.0.3', aliases: ['lb', 'top'], usage: 'leaderboard', help: 'Papan peringkat seluruh user', async execute({ m, prefix }) {
  const rows = await leaderboard(10); const image = await renderLeaderboardCanvas(rows);
  const text = rows.length ? rows.map(x => `#${x.rankPosition} *${x.name}* — Lv.${x.level} • ${x.xp} XP • ${x.coins} coin`).join('\n') : 'Belum ada user.';
  return sendButtons(m, { image, caption: `*NEXORA LEADERBOARD v15*\n\n${text}\n\nPosisi kamu: #${profilePosition(m)}`, footer: 'NEXORA • Ranking', buttons: [button(`${prefix}profile`, 'Profile'), button(`${prefix}inventory`, 'Inventory'), button(`${prefix}menu`, 'Menu')] });
}};
