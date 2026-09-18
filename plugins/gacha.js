import { gacha, RARITY_RATES } from '../lib/gamification.js';
import { sendButtons, button } from '../services/buttons.js';
export default { name: 'gacha', version: '17.0.0', usage: 'gacha', help: 'Gunakan 1 Gacha Key untuk mendapatkan item', async execute({ m, prefix }) {
  try { const r = await gacha(m); return sendButtons(m, { text: `*NEXORA GACHA v17*\n\nKamu mendapatkan: *${r.item.name}*\nRarity: ${r.item.rarity.toUpperCase()}\nType: ${r.item.type}\nEffect: ${r.item.effect}\nExpiry: ${r.item.expiresAt ? new Date(r.item.expiresAt).toLocaleString('id-ID') : 'permanent'}\nSisa key: ${r.keys}\n\nRate: Common ${RARITY_RATES.common}% • Rare ${RARITY_RATES.rare}% • Epic ${RARITY_RATES.epic}% • Mythic ${RARITY_RATES.mythic}% • Legendary ${RARITY_RATES.legendary}%`, footer: 'NEXORA • Gacha', buttons: [button(`${prefix}inventory`, 'Inventory'), button(`${prefix}gacha`, 'Gacha Lagi'), button(`${prefix}profile`, 'Profile')] }); }
  catch (e) { return sendButtons(m, { text: `Gacha: ${e.message}`, buttons: [button(`${prefix}inventory`, 'Inventory'), button(`${prefix}menu`, 'Menu')] }); }
}};
