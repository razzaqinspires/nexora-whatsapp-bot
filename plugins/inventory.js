import { getUserProfile, inventorySummary } from '../lib/gamification.js';
import { renderInventoryCanvas } from '../services/canvas.js';
import { ensureItemIcon } from '../services/item-icon.js';
import { sendButtons, button } from '../services/buttons.js';

export default {
  name: 'inventory', version: '17.0.0', aliases: ['inv', 'bag'], usage: 'inventory', help: 'Lihat inventory, equipment, rarity, expiry',
  async execute({ m, prefix }) {
    const u = getUserProfile(m); const items = inventorySummary(m);
    for (const item of items) { if (!item.iconPng) { const icon = await ensureItemIcon(item); item.iconPng = icon.png; item.iconSvg = icon.svg; } }
    const image = await renderInventoryCanvas(u, items);
    const text = items.length ? items.map((x, i) => `${i + 1}. *${x.name}* [${x.rarity}] • ${x.type} • ${x.expiresAt ? new Date(x.expiresAt).toLocaleString('id-ID') : 'permanent'}`).join('\n') : 'Inventory kosong.';
    return sendButtons(m, {
      image,
      caption: `*NEXORA INVENTORY v17*\n\n${text}\n\nEquip: ${u.equipped.length}/3 • Gacha Keys: ${u.gachaKeys}`,
      footer: 'NEXORA • Inventory Actions',
      buttons: [button(`${prefix}gacha`, 'Gacha'), button(`${prefix}profile`, 'Profile'), button(`${prefix}menu`, 'Menu')]
    });
  }
};
