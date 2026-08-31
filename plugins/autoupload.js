import { getState, setAutoUpload } from '../lib/state.js';
import { config } from '../lib/config.js';
import { instagramStatus, loginInstagram } from '../services/instagram.js';
import { runScheduledPost } from '../services/scheduler.js';

export default {
  name: 'autoupload', aliases: ['auto-upload'], ownerOnly: true,
  async execute({ m, args }) {
    if (args[0] !== '--ig') return m.reply('Gunakan: /autoupload --ig on|off|now|schedule|slots|login');
    const action = (args[1] || '').toLowerCase();
    if (action === 'on') { await setAutoUpload(true); return m.reply('AutoUpload Instagram: ON. Scheduler akan mengikuti slot.'); }
    if (action === 'off') { await setAutoUpload(false); return m.reply('AutoUpload Instagram: OFF.'); }
    if (action === 'slots' || action === 'schedule') return m.reply(`Timezone: ${config.timezone}\nSlot: ${config.slots.join(', ')}\nStatus: ${getState().autoUpload ? 'ON' : 'OFF'}`);
    if (action === 'login') {
      const status = await loginInstagram();
      return m.reply(`Instagram login: ${status.loggedIn ? 'OK' : 'FAILED'}\nMode: ${status.mode}\nUser: ${status.username || '-'}`);
    }
    if (action === 'now') {
      const result = await runScheduledPost('manual');
      return m.reply(result.skipped ? `Tidak dijalankan: ${result.reason}` : `Post selesai. Literacy: ${result.content.literacyId}\nMode: ${result.result.dryRun ? 'DRY RUN' : 'PUBLISHED'}`);
    }
    const ig = await instagramStatus();
    return m.reply(`AutoUpload: ${getState().autoUpload ? 'ON' : 'OFF'}\nInstagram: ${ig.username || '-'} / ${ig.mode}`);
  }
};
