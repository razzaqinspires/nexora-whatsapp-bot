import { dailyClaim } from '../lib/economy.js';
import { sendButtons, button } from '../services/buttons.js';
export default { name: 'daily', version: '15.0.3', aliases: ['claim'], usage: 'daily', category: 'economy', help: 'Daily reward', async execute({ m, prefix }) {
  try { const r = await dailyClaim(m); return sendButtons(m, { text: `*DAILY REWARD v15*\n+${r.xp} XP\n+${r.coins} coins\nTanggal: ${r.date}`, footer: 'NEXORA • Daily', buttons: [button(`${prefix}quest`, 'Quest'), button(`${prefix}profile`, 'Profile')] }); }
  catch (e) { return sendButtons(m, { text: e.message, buttons: [button(`${prefix}profile`, 'Profile'), button(`${prefix}menu`, 'Menu')] }); }
}};
