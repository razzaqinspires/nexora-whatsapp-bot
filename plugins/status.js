import { getState } from '../lib/state.js';
import { getUserProfile, levelProgress } from '../lib/gamification.js';
import { aiHealth } from '../services/ai.js';
import { schedulerStatus } from '../services/scheduler.js';
import { instagramStatus } from '../services/instagram.js';
import { sendButtons, button } from '../services/buttons.js';

export default { name: 'status', version: '17.0.0', aliases: ['stat', 'botstatus'], usage: 'status', help: 'NEXORA system dashboard', async execute({ m, prefix, bot }) {
  const u = getUserProfile(m), p = levelProgress(u.xp), a = aiHealth(), ig = await instagramStatus(), q = schedulerStatus();
  return sendButtons(m, {
    text: `*NEXORA SYSTEM v17*\n\nConnection: ${bot.connected ? 'ONLINE' : 'OFFLINE'}\nUptime: ${Math.floor((Date.now() - bot.startedAt) / 1000)}s\nAI: ${a.filter(x => x.ok).length}/${a.length} provider ready\nInstagram: ${ig.mode}\nScheduler: ${q.paused ? 'PAUSED' : 'READY'}\n\n*USER*\nLevel ${u.level} • ${u.rank}\nXP ${u.xp} • ${p.progress}%\nCoins ${u.coins} • Keys ${u.gachaKeys}\nCommands ${u.commands}\nMaintenance ${getState().maintenance ? 'ON' : 'OFF'}`,
    footer: 'NEXORA • System Actions',
    buttons: [button(`${prefix}profile`, 'Profile'), button(`${prefix}dashboard`, 'Dashboard'), button(`${prefix}menu`, 'Menu')]
  });
}};
