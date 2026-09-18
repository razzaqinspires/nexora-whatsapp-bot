import { getUserProfile, levelProgress, profilePosition } from '../lib/gamification.js';
import { renderProfileCanvas } from '../services/canvas.js';
import { getState } from '../lib/state.js';
import { sendButtons, button } from '../services/buttons.js';

export default {
  name: 'profile', version: '15.0.3', aliases: ['me', 'rank', 'level'], usage: 'profile', help: 'Profil XP, level, coin, rank, premium',
  async execute({ m, prefix }) {
    const u = getUserProfile(m); const p = levelProgress(u.xp); const prem = m.isPremium;
    const premiumUntil = getState().premiumUntil?.[u.id] ? new Date(getState().premiumUntil[u.id]).toLocaleString('id-ID') : (prem ? 'Aktif' : '—');
    const image = await renderProfileCanvas({ ...u, ...p, nextXp: p.next }, { role: m.role, premium: prem, premiumUntil, position: profilePosition(m) });
    return sendButtons(m, {
      image,
      caption: `*NEXORA PROFILE v15*\nLevel ${u.level} • ${u.rank}\nXP ${u.xp} • Coins ${u.coins}\nRank #${profilePosition(m)} • Premium ${prem ? 'ON' : 'OFF'}`,
      footer: 'NEXORA • Profile Actions',
      buttons: [button(`${prefix}inventory`, 'Inventory'), button(`${prefix}leaderboard`, 'Leaderboard'), button(`${prefix}menu`, 'Menu')]
    });
  }
};
