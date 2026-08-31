import { config } from '../lib/config.js';
export default {
  name: 'security', ownerOnly: true,
  async execute({ m }) {
    const owners = config.security.ownerJids.size ? [...config.security.ownerJids].join(', ') : 'BELUM DISET';
    await m.reply(`*SECURITY*\n\nOwners: ${owners}\nAllow private: ${config.security.allowPrivate}\nAllow groups: ${config.security.allowGroups}\nRate limit: ${config.security.rateLimitMax}/${config.security.rateLimitWindowMs}ms\nCooldown: ${config.security.commandCooldownMs}ms\nAudit log: ${process.env.AUDIT_LOG ?? 'true'}`);
  }
};
