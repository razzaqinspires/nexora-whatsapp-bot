import fs from 'node:fs/promises';
import path from 'node:path';
import { areJidsSameUser, jidNormalizedUser } from '@whiskeysockets/baileys';

const buckets = new Map();
const commandBuckets = new Map();
const warned = new Set();

export function normalizeJid(jid = '') {
  const value = String(jid).trim().toLowerCase();
  if (!value) return '';
  if (/^\d{7,20}$/.test(value)) return `${value}@s.whatsapp.net`;
  return jidNormalizedUser(value) || value;
}

export function sameUser(a, b) {
  const left = normalizeJid(a);
  const right = normalizeJid(b);
  if (!left || !right) return false;
  try { return areJidsSameUser(left, right); } catch { return left === right; }
}

export function candidateJids(value) {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.flatMap(v => String(v || '').split(',').map(normalizeJid).filter(Boolean)))];
}

export function matchesAnyUser(candidates, configured) {
  const wanted = configured instanceof Set ? [...configured] : candidateJids(configured);
  return candidateJids(candidates).some(candidate => wanted.some(item => sameUser(candidate, item)));
}

export function isOwner(jidOrCandidates, config) {
  return matchesAnyUser(jidOrCandidates, config.security.ownerJids);
}

export function isAllowedContext(m, config) {
  if (m.isGroup && !config.security.allowGroups) return false;
  if (!m.isGroup && !config.security.allowPrivate) return false;
  if (m.identity?.all?.some(jid => config.security.blockJids.has(normalizeJid(jid)))) return false;
  if (config.security.blockJids.has(normalizeJid(m.sender))) return false;
  return true;
}

function hit(map, key, limit, windowMs) {
  const now = Date.now();
  const item = map.get(key);
  if (!item || now - item.windowStart >= windowMs) {
    map.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }
  item.count += 1;
  return { allowed: item.count <= limit, remaining: Math.max(0, limit - item.count) };
}

export function checkRateLimit(jid, config, { premium = false } = {}) {
  const limit = premium ? config.security.premiumRateLimitMax : config.security.rateLimitMax;
  return hit(buckets, normalizeJid(jid), limit, config.security.rateLimitWindowMs);
}

export function checkCommandCooldown(jid, config) {
  const key = normalizeJid(jid);
  const now = Date.now();
  const previous = commandBuckets.get(key) || 0;
  if (now - previous < config.security.commandCooldownMs) {
    return { allowed: false, retryAfter: config.security.commandCooldownMs - (now - previous) };
  }
  commandBuckets.set(key, now);
  return { allowed: true, retryAfter: 0 };
}

export async function audit(event, data = {}) {
  if (!process.env.AUDIT_LOG || ['0', 'false', 'off', 'no'].includes(String(process.env.AUDIT_LOG).toLowerCase())) return;
  try {
    await fs.mkdir(path.dirname('./logs/audit.log'), { recursive: true });
    await fs.appendFile('./logs/audit.log', `${JSON.stringify({ ts: new Date().toISOString(), event, ...data })}\n`);
  } catch (error) {
    if (!warned.has('audit')) {
      warned.add('audit');
      console.error('[SECURITY] audit log failed:', error.message);
    }
  }
}

export function securitySummary(config) {
  return [
    '*SECURITY V9*',
    `Owner JIDs: ${config.security.ownerJids.size}`,
    `Admin JIDs: ${config.security.adminJids.size}`,
    `Block JIDs: ${config.security.blockJids.size}`,
    `Rate limit: ${config.security.rateLimitMax}/${config.security.rateLimitWindowMs}ms`,
    `Premium rate: ${config.security.premiumRateLimitMax}/${config.security.rateLimitWindowMs}ms`,
    `Cooldown: ${config.security.commandCooldownMs}ms`,
    `Groups: ${config.security.allowGroups ? 'ON' : 'OFF'}`,
    `Private: ${config.security.allowPrivate ? 'ON' : 'OFF'}`,
    `Self commands: ${config.security.allowSelfCommands ? 'ON' : 'OFF'}`
  ].join('\n');
}
