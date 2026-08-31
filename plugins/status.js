import { getState, getDailyCount } from '../lib/state.js';
import { config } from '../lib/config.js';
import { instagramStatus } from '../services/instagram.js';

export default {
  name: 'status',
  async execute({ m, bot }) {
    const ig = await instagramStatus();
    const state = getState();
    const up = Math.floor((Date.now() - bot.startedAt) / 1000);
    await m.reply(`*STATUS NEXORA*\n\nWhatsApp: ${bot.connected ? 'CONNECTED' : 'DISCONNECTED'}\nAuth mode: ${bot.authMode.toUpperCase()}\nUptime: ${up}s\nReconnects: ${bot.reconnects}\nAutoUpload: ${state.autoUpload ? 'ON' : 'OFF'}\nDaily posts: ${getDailyCount()}/${config.maxDailyPosts}\nSlots: ${config.slots.join(', ')}\nInstagram: ${ig.username || '-'} (${ig.mode})`);
  }
};
