import 'dotenv/config';
import { normalizeJid } from './security.js';

const bool = (v, fallback = false) => {
  if (v == null || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const csv = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean);

export const config = {
  prefix: process.env.BOT_PREFIX || '/',
  timezone: process.env.NEXORA_TIMEZONE || 'Asia/Jakarta',
  slots: csv(process.env.NEXORA_SLOTS || '09:00,13:00,19:00'),
  autoUploadDefault: bool(process.env.NEXORA_AUTOUPLOAD, false),
  dryRun: bool(process.env.DRY_RUN, true),
  maxDailyPosts: Number(process.env.MAX_DAILY_POSTS || 3),
  auth: {
    mode: String(process.env.AUTH_MODE || 'qr').toLowerCase(),
    pairingPhone: String(process.env.PAIRING_PHONE || '').replace(/\D/g, ''),
    authDir: process.env.AUTH_DIR || './session/whatsapp'
  },
  reconnect: {
    enabled: bool(process.env.AUTO_RECONNECT, true),
    initialDelay: Number(process.env.RECONNECT_DELAY_MS || 3000),
    maxDelay: Number(process.env.MAX_RECONNECT_DELAY_MS || 30000)
  },
  security: {
    ownerJids: new Set(csv(process.env.OWNER_JIDS).map(normalizeJid)),
    blockedJids: new Set(csv(process.env.BLOCKED_JIDS).map(normalizeJid)),
    allowGroups: bool(process.env.ALLOW_GROUPS, true),
    allowPrivate: bool(process.env.ALLOW_PRIVATE, true),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 8),
    commandCooldownMs: Number(process.env.COMMAND_COOLDOWN_MS || 1200)
  },
  ai: {
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini'
  },
  instagram: {
    username: process.env.IG_USERNAME || '',
    password: process.env.IG_PASSWORD || '',
    autoLogin: bool(process.env.IG_AUTO_LOGIN, false),
    sessionFile: process.env.IG_SESSION_FILE || './data/instagram-session.json'
  }
};

export const validAuthMode = ['qr', 'pairing'].includes(config.auth.mode) ? config.auth.mode : 'qr';

export function isOwner(jid) {
  return config.security.ownerJids.size > 0 && config.security.ownerJids.has(normalizeJid(jid));
}
