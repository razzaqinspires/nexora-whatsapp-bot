import { getState, setPremiumUsers } from '../lib/state.js';
import { isOwner, normalizeJid } from '../lib/security.js';

export default {
  name: 'premium', aliases: ['prem'], usage: 'premium status|add|del|list <jid>', help: 'Status premium atau kelola premium (owner)',
  async execute({ m, args, config }) {
    const action = (args[0] || 'status').toLowerCase();
    const self = m.identity?.pn || m.sender;
    const users = new Set(getState().premiumUsers);

    if (action === 'status') {
      const active = m.isPremium || isOwner(m.identity?.all || m.sender, config);
      return m.reply({ text: `Premium kamu: *${active ? 'ON' : 'OFF'}*\nRole: ${m.role.toUpperCase()}` });
    }

    if (!m.isOwner) return m.reply({ text: 'Command ini hanya untuk owner bot.' });
    if (action === 'list') return m.reply({ text: `*PREMIUM USERS*\n${[...users].map((x, i) => `${i + 1}. ${x}`).join('\n') || '-'}` });

    const jid = normalizeJid(args[1] || '');
    if (!jid.includes('@')) return m.reply({ text: 'Contoh: /premium add 6281234567890' });
    if (isOwner(jid, config)) return m.reply({ text: 'Owner otomatis memiliki akses premium.' });

    if (action === 'add') users.add(jid);
    else if (action === 'del') users.delete(jid);
    else return m.reply({ text: 'Gunakan /premium status|add|del|list <jid>' });

    await setPremiumUsers([...users]);
    return m.reply({ text: `Premium ${action === 'add' ? 'ditambahkan' : 'dihapus'}: ${jid}` });
  }
};
