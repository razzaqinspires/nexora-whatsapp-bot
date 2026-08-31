import { isOwner } from '../lib/config.js';
export default {
  name: 'reload',
  async execute({ m, reloadPlugins }) {
    if (!isOwner(m.sender)) return m.reply('Command ini khusus owner.');
    await reloadPlugins();
    await m.reply('Plugin berhasil di-reload.');
  }
};
