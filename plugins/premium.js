import { getState, setPremiumUsers, setPremiumUntil } from '../lib/state.js';
import { isOwner, normalizeJid } from '../lib/security.js';

export default { version:'17.0.0', 
  name: 'premium', aliases: ['prem'], usage: 'premium status|add|del|list <jid> [days]', help: 'Status premium atau kelola premium (owner)',
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

    if (action === 'add') {
      users.add(jid);
      const days = Math.max(1, Number(args[2] || 30));
      await setPremiumUntil(jid, new Date(Date.now() + days * 86400000).toISOString());
    }
    else if (action === 'del') { users.delete(jid); await setPremiumUntil(jid, null); }
    else return m.reply({ text: 'Gunakan /premium status|add|del|list <jid>' });

    await setPremiumUsers([...users]);
    return m.reply({ text: `Premium ${action === 'add' ? 'ditambahkan' : 'dihapus'}: ${jid}` });
  }
};
