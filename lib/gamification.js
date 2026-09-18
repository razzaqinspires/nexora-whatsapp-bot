import crypto from 'node:crypto';
import { getState, persistGamification } from './state.js';
import { ensureItemIcon } from '../services/item-icon.js';

import { RARITY_RATES, MAX_EQUIPPED, levelFromXp, levelBounds, levelProgress, rankForLevel } from './leveling.js';
export { RARITY_RATES, MAX_EQUIPPED, levelFromXp, levelBounds, levelProgress, rankForLevel };

const rarityWeight = Object.entries(RARITY_RATES);
const now = () => Date.now();

export function userKey(m) {
  return String(m?.identity?.pn || m?.identity?.lid || m?.sender || '').toLowerCase();
}

function ensureUser(m) {
  const key = userKey(m);
  if (!key) throw new Error('Identity user tidak tersedia.');
  const users = getState().users;
  users[key] ||= {
    id: key, name: m.pushName || key.split('@')[0], xp: 0, coins: 0, commands: 0,
    level: 1, rank: 'Rookie', inventory: [], equipped: [], gachaKeys: 0,
    createdAt: new Date().toISOString(), lastSeen: new Date().toISOString()
  };
  const u = users[key];
  u.name = m.pushName || u.name || key.split('@')[0];
  u.lastSeen = new Date().toISOString();
  u.level = levelFromXp(u.xp);
  return u;
}

export function getUserProfile(m) { return ensureUser(m); }
export function getAllProfiles() { return Object.values(getState().users || {}); }

export function getRank(profile) { return rankForLevel(levelFromXp(profile?.xp || 0)); }

function pickRarity() {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const [rarity, weight] of rarityWeight) { cursor += weight; if (roll < cursor) return rarity; }
  return 'common';
}

const ITEMS = {
  common: [
    { id: 'coin-boost', name: 'Coin Booster', type: 'buff', effect: '+10% coin', duration: 24 * 60 * 60 * 1000 },
    { id: 'xp-potion-s', name: 'XP Potion S', type: 'potion', effect: '+50 XP', duration: 0 }
  ],
  rare: [
    { id: 'xp-boost', name: 'XP Booster', type: 'buff', effect: '+20% XP', duration: 24 * 60 * 60 * 1000 },
    { id: 'coin-potion', name: 'Coin Potion', type: 'potion', effect: '+100 coins', duration: 0 }
  ],
  epic: [
    { id: 'lucky-core', name: 'Lucky Core', type: 'buff', effect: '+5% gacha luck', duration: 3 * 24 * 60 * 60 * 1000 },
    { id: 'xp-potion-m', name: 'XP Potion M', type: 'potion', effect: '+250 XP', duration: 0 }
  ],
  mythic: [
    { id: 'nexora-overdrive', name: 'NEXORA Overdrive', type: 'buff', effect: '+50% XP & coin', duration: 24 * 60 * 60 * 1000 },
    { id: 'key-pack', name: 'Gacha Key Pack', type: 'key', effect: '+3 Gacha Keys', duration: 0 }
  ],
  legendary: [
    { id: 'singularity', name: 'NEXORA Singularity', type: 'buff', effect: '+100% XP & coin', duration: 7 * 24 * 60 * 60 * 1000 },
    { id: 'legend-key', name: 'Legendary Key', type: 'key', effect: '+10 Gacha Keys', duration: 0 }
  ]
};

export function randomItem(rarity = pickRarity()) {
  const pool = ITEMS[rarity] || ITEMS.common;
  return { ...pool[Math.floor(Math.random() * pool.length)], rarity };
}

export async function awardItem(m, source = 'level') {
  const u = ensureUser(m);
  const rarity = pickRarity();
  const item = randomItem(rarity);
  const icon = await ensureItemIcon(item);
  const instance = { ...item, uid: crypto.randomUUID(), source, obtainedAt: new Date().toISOString(), expiresAt: item.duration ? new Date(now() + item.duration).toISOString() : null, uses: item.type === 'potion' ? 1 : null, iconSvg: icon.svg, iconPng: icon.png, iconMode: icon.mode };
  if (item.type === 'key') u.gachaKeys += Number((item.effect.match(/\d+/) || [1])[0]);
  else u.inventory.push(instance);
  await persistGamification();
  return instance;
}

export async function addActivity(m, { xp = 10, coins = 1 } = {}) {
  const u = ensureUser(m);
  const before = u.level;
  const activeBuffs = getActiveBuffs(u);
  const xpMultiplier = activeBuffs.some(x => /100% XP/.test(x.effect)) ? 2 : activeBuffs.some(x => /20% XP/.test(x.effect)) ? 1.2 : activeBuffs.some(x => /50% XP/.test(x.effect)) ? 1.5 : 1;
  const coinMultiplier = activeBuffs.some(x => /100% XP & coin/.test(x.effect)) ? 2 : activeBuffs.some(x => /50% XP & coin/.test(x.effect)) ? 1.5 : activeBuffs.some(x => /10% coin/.test(x.effect)) ? 1.1 : 1;
  u.xp += Math.max(0, Math.round(xp * xpMultiplier));
  u.coins += Math.max(0, Math.round(coins * coinMultiplier));
  u.commands += 1;
  u.level = levelFromXp(u.xp);
  const levelUp = u.level > before;
  let reward = null;
  if (levelUp) {
    reward = await awardItem(m, 'level-up');
    u.gachaKeys += 1;
  }
  u.rank = getRank(u);
  await persistGamification();
  return { user: u, levelUp, oldLevel: before, reward, progress: levelProgress(u.xp) };
}

export function getActiveBuffs(profile) {
  const t = now();
  const equipped = new Set(profile?.equipped || []);
  return (profile?.inventory || []).filter(x => x.type === 'buff' && equipped.has(x.uid) && (!x.expiresAt || new Date(x.expiresAt).getTime() > t));
}

export function inventorySummary(m) {
  const u = ensureUser(m);
  return u.inventory.map((x, i) => ({ slot: i + 1, ...x, active: !x.expiresAt || new Date(x.expiresAt).getTime() > now() }));
}

export async function equipItem(m, indexOrUid) {
  const u = ensureUser(m);
  if (u.equipped.length >= MAX_EQUIPPED) throw new Error('Maksimal 3 slot equip. Unequip item terlebih dahulu.');
  const item = findItem(u, indexOrUid);
  if (!item) throw new Error('Item tidak ditemukan.');
  if (item.type === 'potion' || item.type === 'key') throw new Error('Item ini bukan equipment. Gunakan .use untuk consumable/key.');
  if (u.equipped.includes(item.uid)) throw new Error('Item sudah di-equip.');
  u.equipped.push(item.uid);
  await persistGamification();
  return item;
}

export async function unequipItem(m, indexOrUid) {
  const u = ensureUser(m);
  const item = findItem(u, indexOrUid);
  if (!item) throw new Error('Item tidak ditemukan.');
  u.equipped = u.equipped.filter(uid => uid !== item.uid);
  await persistGamification();
  return item;
}

function findItem(u, ref) {
  const value = String(ref || '').trim();
  const index = Number(value);
  if (Number.isInteger(index) && index > 0) return u.inventory[index - 1];
  return u.inventory.find(x => x.uid === value || x.id === value || x.name.toLowerCase() === value.toLowerCase());
}

export async function useItem(m, ref) {
  const u = ensureUser(m);
  const item = findItem(u, ref);
  if (!item) throw new Error('Item tidak ditemukan.');
  if (item.type === 'buff') return equipItem(m, item.uid);
  if (item.type === 'key') { u.gachaKeys += Number((item.effect.match(/\d+/) || [1])[0]); u.inventory = u.inventory.filter(x => x.uid !== item.uid); await persistGamification(); return { ...item, used: true }; }
  if (item.type !== 'potion') throw new Error('Item tidak dapat digunakan.');
  if (item.id.includes('xp-potion')) u.xp += Number((item.effect.match(/\d+/) || [0])[0]);
  else if (item.id === 'coin-potion') u.coins += Number((item.effect.match(/\d+/) || [0])[0]);
  u.level = levelFromXp(u.xp); u.rank = getRank(u);
  u.inventory = u.inventory.filter(x => x.uid !== item.uid);
  await persistGamification();
  return { ...item, used: true, profile: u };
}

export async function gacha(m) {
  const u = ensureUser(m);
  if (u.gachaKeys < 1) throw new Error('Gacha Key tidak cukup. Dapatkan key dari level-up atau item.');
  u.gachaKeys -= 1;
  const item = randomItem();
  const icon = await ensureItemIcon(item);
  const instance = { ...item, uid: crypto.randomUUID(), source: 'gacha', obtainedAt: new Date().toISOString(), expiresAt: item.duration ? new Date(now() + item.duration).toISOString() : null, uses: item.type === 'potion' ? 1 : null, iconSvg: icon.svg, iconPng: icon.png, iconMode: icon.mode };
  u.inventory.push(instance);
  await persistGamification();
  return { item: instance, keys: u.gachaKeys };
}

export async function setLevelNotify(chat, enabled) {
  const s = getState();
  s.groupSettings ||= {};
  s.groupSettings[chat] ||= {};
  s.groupSettings[chat].levelNotify = Boolean(enabled);
  await persistGamification();
  return s.groupSettings[chat].levelNotify;
}
export function levelNotifyEnabled(chat) { return Boolean(getState().groupSettings?.[chat]?.levelNotify); }

export async function leaderboard(limit = 10) {
  return getAllProfiles().sort((a, b) => (b.xp - a.xp) || (b.coins - a.coins)).slice(0, limit).map((u, i) => ({ ...u, rankPosition: i + 1, rank: getRank(u) }));
}

export function profilePosition(m) {
  const all = getAllProfiles().sort((a, b) => b.xp - a.xp);
  const key = userKey(m);
  return Math.max(1, all.findIndex(x => x.id === key) + 1);
}
