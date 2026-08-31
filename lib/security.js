import fs from 'node:fs/promises';
import path from 'node:path';

const buckets = new Map();
const commandBuckets = new Map();
const warned = new Set();

export function normalizeJid(jid = '') {
  return String(jid).trim().toLowerCase();
}

export function isAllowedContext(m, config) {
  if (m.isGroup && !config.security.allowGroups) return false;
  if (!m.isGroup && !config.security.allowPrivate) return false;
  if (config.security.blockedJids.has(normalizeJid(m.sender))) return false;
  return true;
}

export function isOwner(jid, config) {
  if (!config.security.ownerJids.size) return false;
  return config.security.ownerJids.has(normalizeJid(jid));
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

export function checkRateLimit(jid, config) {
  return hit(buckets, normalizeJid(jid), config.security.rateLimitMax, config.security.rateLimitWindowMs);
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
    const row = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n';
    await fs.appendFile('./logs/audit.log', row, 'utf8');
  } catch (error) {
    if (!warned.has('audit')) {
      warned.add('audit');
      console.error('[SECURITY] audit log failed:', error.message);
    }
  }
}
