import { getState } from '../lib/state.js';
import { config } from '../lib/config.js';
import { nowText } from '../lib/utils.js';
import { aiStatus } from '../services/ai.js';
import { instagramStatus } from '../services/instagram.js';
import { schedulerStatus } from '../services/scheduler.js';

export default {
  name: 'status',
  async execute({ m, bot }) {
    const s = getState();
    const ig = await instagramStatus();
    const ai = aiStatus();
    const sch = schedulerStatus();
    await m.reply(`NEXORA STATUS\n\nWhatsApp: ${bot.connected ? 'CONNECTED' : 'OFFLINE'}\nAutoUpload IG: ${s.autoUpload.ig ? 'ON' : 'OFF'}\nScheduler: ${sch.active ? 'ACTIVE' : 'STOPPED'}\nSlots: ${sch.slots.join(', ')} (${sch.timezone})\nIG target: @${ig.username || 'xarvionex'}\nIG mode: ${ig.mode}\nIG login: ${ig.loggedIn ? 'YES' : 'NO'}\nAI: ${ai.enabled ? `ON (${ai.model})` : 'LOCAL FALLBACK'}\nGenerated: ${s.stats.generated}\nPublished: ${s.stats.published}\nFailed: ${s.stats.failed}\nNow: ${nowText(config.timezone)}`);
  }
};
