import { getState, setAccessMode } from './state.js';
import { normalizeJid, isOwner, sameUser } from './security.js';

export function getAccessMode(config) { return getState().accessMode || config.accessMode; }
export async function changeAccessMode(mode) {
  if (!['public', 'self'].includes(mode)) throw new Error('Mode harus public atau self.');
  await setAccessMode(mode);
  return mode;
}
export function isSelfActor(m, bot) {
  return Boolean(m?.isFromMe || m?.identity?.isBot || (bot.userJid && sameUser(m.sender, bot.userJid)));
}
export function isAdmin(jid, config, m = null) {
  if (isOwner(jid, config)) return true;
  if (config.security.adminJids.has(normalizeJid(jid)) || getState().admins.includes(normalizeJid(jid))) return true;
  return Boolean(m?.isGroupAdmin && sameUser(jid, m.sender));
}
export function isPremium(jid, config) {
  if (isOwner(jid, config)) return true;
  const candidates = Array.isArray(jid) ? jid : [jid];
  const state = getState();
  return state.premiumUsers.some(item => candidates.some(candidate => {
    if (!sameUser(item, candidate)) return false;
    const until = state.premiumUntil?.[item] || state.premiumUntil?.[candidate];
    return !until || new Date(until).getTime() > Date.now();
  }));
}
export function roleOf(jid, config, m = null) {
  if (isOwner(jid, config)) return 'owner';
  if (isAdmin(jid, config, m)) return 'admin';
  if (isPremium(jid, config)) return 'premium';
  return 'user';
}
export function canProcessMessage(m, bot, config) {
  if (!m?.raw?.message && !m?.message) return false;
  if (config.security.blockJids.has(normalizeJid(m.sender))) return false;
  const mode = getAccessMode(config);
  const self = isSelfActor(m, bot);
  if (self && !config.security.allowSelfCommands) return false;
  if (mode === 'self') return self || isOwner(m.identity?.all || m.sender, config);
  return !self;
}
export function canUsePlugin(plugin, jid, config, bot, m) {
  const role = roleOf(jid, config, m);
  const self = isSelfActor(m, bot);
  if (plugin.ownerOnly && role !== 'owner' && !(getAccessMode(config) === 'self' && self)) return false;
  if (plugin.adminOnly && !['owner', 'admin'].includes(role) && !(getAccessMode(config) === 'self' && self)) return false;
  if (plugin.premiumOnly && !['owner', 'admin', 'premium'].includes(role) && !(getAccessMode(config) === 'self' && self)) return false;
  if (plugin.groupOnly && !m?.isGroup) return false;
  if (plugin.groupAdminOnly && (!m?.isGroup || !m?.isGroupAdmin) && !(getAccessMode(config) === 'self' && self)) return false;
  if (plugin.botAdminRequired && m?.isGroup && !m?.isBotAdmin && !(getAccessMode(config) === 'self' && self)) return false;
  if (getState().maintenance && !['owner', 'admin'].includes(role) && !(getAccessMode(config) === 'self' && self)) return false;
  return true;
}
