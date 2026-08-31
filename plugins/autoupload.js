import { getState, saveState } from '../lib/state.js';
import { isOwner } from '../lib/config.js';
import { config } from '../lib/config.js';
import { runSlot, schedulerStatus } from '../services/scheduler.js';
import { loginInstagram } from '../services/instagram.js';

export default {
  name: 'autoupload',
  async execute({ m, args }) {
    if (!isOwner(m.sender)) return m.reply('Command ini khusus owner.');
    if (args[0] !== '--ig') return m.reply('Gunakan /autoupload --ig on|off|now|schedule|slots|login');
    const action = (args[1] || '').toLowerCase();
    const state = getState();

    if (action === 'on') {
      state.autoUpload.ig = true;
      await saveState();
      return m.reply(`AutoUpload IG: ON\nSlot: ${config.slots.join(', ')}\nTimezone: ${config.timezone}\nMode: ${config.dryRun ? 'DRY RUN (belum publish)' : 'PRIVATE API'}`);
    }
    if (action === 'off') {
      state.autoUpload.ig = false;
      await saveState();
      return m.reply('AutoUpload IG: OFF');
    }
    if (action === 'slots' || action === 'schedule') {
      const s = schedulerStatus();
      return m.reply(`Scheduler: ${s.active ? 'ACTIVE' : 'STOPPED'}\nTimezone: ${s.timezone}\nSlots: ${s.slots.join(', ')}`);
    }
    if (action === 'login') {
      const result = await loginInstagram();
      return m.reply(`Instagram login: ${result.loggedIn ? 'BERHASIL' : 'GAGAL'}\nAkun: @${result.username}`);
    }
    if (action === 'now') {
      if (!state.autoUpload.ig) return m.reply('AutoUpload masih OFF. Nyalakan dengan /autoupload --ig on');
      const result = await runSlot('manual', 'whatsapp');
      if (result.error) return m.reply(`Gagal: ${result.error}`);
      return m.reply(`Konten dibuat.\nID: ${result.id}\nTopik: ${result.topic}\nStatus: ${result.status || 'draft'}\nFile: ${(result.media || []).join('\n')}`);
    }
    return m.reply('Gunakan /autoupload --ig on|off|now|schedule|slots|login');
  }
};
