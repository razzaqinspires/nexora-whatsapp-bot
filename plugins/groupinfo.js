export default {
  name: 'groupinfo', aliases: ['ginfo'], groupOnly: true, usage: 'groupinfo', help: 'Metadata grup dan status admin',
  async execute({ m }) {
    const g = m.group || {};
    const admins = (g.admins || []).map(p => p.phoneNumber || p.id || p.lid).filter(Boolean);
    return m.reply({ text: [
      '*GROUP INFO*', `Subject: ${g.subject || '-'}`, `ID: ${g.id || '-'}`, `Size: ${g.size || 0}`,
      `Owner: ${g.ownerPn || g.owner || '-'}`, `Addressing: ${g.addressingMode || '-'}`,
      `Announce: ${g.announce ? 'ON' : 'OFF'}`, `Restrict: ${g.restrict ? 'ON' : 'OFF'}`,
      `Member Add: ${g.memberAddMode ? 'ON' : 'OFF'}`, `Join Approval: ${g.joinApprovalMode ? 'ON' : 'OFF'}`,
      `Bot Admin: ${m.isBotAdmin ? 'YES' : 'NO'}`, `Your Admin: ${m.isGroupAdmin ? 'YES' : 'NO'}`,
      `Admins: ${admins.length ? admins.join(', ') : '-'}`
    ].join('\n') });
  }
};
