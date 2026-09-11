import { getState } from '../lib/state.js';
import { instagramStatus } from '../services/instagram.js';
import { schedulerStatus } from '../services/scheduler.js';

export default {
  name: 'status', usage: 'status', help: 'Status bot, scheduler, akses, dan Instagram',
  async execute({ m, bot, config }) {
    const ig = await instagramStatus();
    const scheduler = schedulerStatus();
    const state = getState();
    await m.reply({ text: [
      '*NEXORA STATUS V7*',
      `Connection: ${bot.connected ? 'ONLINE' : 'OFFLINE'}`,
      `Uptime: ${Math.floor((Date.now() - bot.startedAt) / 1000)}s`,
      `Access: ${state.accessMode.toUpperCase()}`,
      `Role: ${m.role.toUpperCase()}`,
      `Premium: ${m.isPremium ? 'ON' : 'OFF'}`,
      `Maintenance: ${state.maintenance ? 'ON' : 'OFF'}`,
      `AutoUpload: ${state.autoUpload ? 'ON' : 'OFF'}`,
      `Scheduler: ${scheduler.paused ? 'PAUSED' : 'RUNNING'}`,
      `Instagram: ${ig.username || '-'} (${ig.mode})`,
      `Dry Run: ${config.dryRun ? 'YES' : 'NO'}`
    ].join('\n') });
  }
};
