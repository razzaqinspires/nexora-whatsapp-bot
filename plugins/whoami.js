export default {
  name: 'whoami', aliases: ['me', 'identity'], usage: 'whoami', help: 'Tampilkan identitas dan hak akses pesan',
  async execute({ m }) {
    const lines = [
      '*NEXORA IDENTITY*',
      `Role: ${m.role.toUpperCase()}`,
      `Sender: ${m.sender || '-'}`,
      `PN: ${m.identity?.pn || '-'}`,
      `LID: ${m.identity?.lid || '-'}`,
      `Owner: ${m.isOwner ? 'YES' : 'NO'}`,
      `Admin: ${m.isAdmin ? 'YES' : 'NO'}`,
      `Premium: ${m.isPremium ? 'YES' : 'NO'}`,
      `From Me: ${m.isFromMe ? 'YES' : 'NO'}`,
      `Bot Admin: ${m.isBotAdmin ? 'YES' : 'NO'}`,
      `Group Admin: ${m.isGroupAdmin ? 'YES' : 'NO'}`,
      `Chat: ${m.isGroup ? 'GROUP' : 'PRIVATE'}`
    ];
    if (m.isGroup) lines.push(`Group: ${m.group?.subject || '-'}`, `Group ID: ${m.group?.id || '-'}`, `Participants: ${m.group?.size || 0}`, `Addressing: ${m.group?.addressingMode || '-'}`);
    return m.reply({ text: lines.join('\n') });
  }
};
