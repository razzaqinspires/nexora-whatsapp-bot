import { getAccessMode } from '../lib/access.js';
import { getState } from '../lib/state.js';

export default {
  name: 'menu', aliases: ['help'], usage: 'menu [help]', help: 'Daftar command',
  async execute({ m, prefix, router, config }) {
    const lines = [
      '*NEXORA BOT v7*', '', '*COMMANDS*', ...router.help(prefix), '',
      `Access: ${getAccessMode(config).toUpperCase()}`,
      `Role: ${m.role.toUpperCase()}`,
      `Premium: ${m.isPremium ? 'ON' : 'OFF'}`,
      `Maintenance: ${getState().maintenance ? 'ON' : 'OFF'}`,
      `Disabled plugins: ${getState().disabledPlugins.length}`
    ];
    await m.reply({ text: lines.join('\n') });
  }
};
