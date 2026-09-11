import 'dotenv/config';
import { normalizeJid } from './security.js';

const bool = (v, fallback = false) => v == null || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
const csv = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const num = (v, fallback, min = -Infinity, max = Infinity) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : fallback; };

const authMode = String(process.env.AUTH_MODE || 'qr').toLowerCase();
const accessMode = String(process.env.BOT_ACCESS_MODE || 'public').toLowerCase();

export const config = {
  version: 7,
  prefix: process.env.BOT_PREFIX || '/',
  timezone: process.env.NEXORA_TIMEZONE || 'Asia/Jakarta',
  accessMode: ['public', 'self'].includes(accessMode) ? accessMode : 'public',
  auth: {
    mode: ['qr', 'pairing'].includes(authMode) ? authMode : 'qr',
    pairingPhone: String(process.env.PAIRING_PHONE || '').replace(/\D/g, ''),
    authDir: process.env.AUTH_DIR || './auth'
  },
  security: {
    ownerJids: new Set(csv(process.env.OWNER_JIDS).map(normalizeJid)),
    adminJids: new Set(csv(process.env.ADMIN_JIDS).map(normalizeJid)),
    blockJids: new Set(csv(process.env.BLOCK_JIDS).map(normalizeJid)),
    rateLimitMax: num(process.env.RATE_LIMIT_MAX, 15, 1, 1000),
    premiumRateLimitMax: num(process.env.PREMIUM_RATE_LIMIT_MAX, 40, 1, 5000),
    rateLimitWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 10000, 100, 3600000),
    commandCooldownMs: num(process.env.COMMAND_COOLDOWN_MS, 750, 0, 60000),
    maxCommandLength: num(process.env.MAX_COMMAND_LENGTH, 2000, 50, 20000),
    maintenanceDefault: bool(process.env.MAINTENANCE_MODE, false),
    allowSelfCommands: bool(process.env.ALLOW_SELF_COMMANDS, true),
    audit: bool(process.env.AUDIT_LOG, true),
    allowGroups: bool(process.env.ALLOW_GROUPS, true),
    allowPrivate: bool(process.env.ALLOW_PRIVATE, true)
  },
  ai: {
    baseUrl: process.env.AI_BASE_URL || '', apiKey: process.env.AI_API_KEY || '', model: process.env.AI_MODEL || 'default',
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 15000, 1000, 120000), temperature: num(process.env.AI_TEMPERATURE, 0.7, 0, 2), retries: num(process.env.AI_RETRIES, 2, 0, 5)
  },
  automation: {
    slots: csv(process.env.NEXORA_SLOTS || '09:00,13:00,19:00'),
    autoUploadDefault: bool(process.env.NEXORA_AUTOUPLOAD, false),
    maxDailyPosts: num(process.env.NEXORA_MAX_DAILY_POSTS, 3, 1, 100),
    retryAttempts: num(process.env.NEXORA_JOB_RETRIES, 2, 0, 5),
    cooldownMinutes: num(process.env.NEXORA_JOB_COOLDOWN_MIN, 5, 0, 1440)
  },
  dryRun: bool(process.env.DRY_RUN, true),
  instagram: { username: process.env.IG_USERNAME || '', password: process.env.IG_PASSWORD || '', sessionFile: process.env.IG_SESSION_FILE || './auth/instagram-session.json' }
};

export function validateConfig() {
  const warnings = [];
  if (!config.security.ownerJids.size) warnings.push('OWNER_JIDS kosong: owner-only commands akan ditolak.');
  if (config.auth.mode === 'pairing' && !config.auth.pairingPhone) warnings.push('PAIRING_PHONE kosong: pairing akan meminta input terminal.');
  if (!config.ai.baseUrl || !config.ai.apiKey) warnings.push('AI provider belum dikonfigurasi: /nexora memakai fallback lokal.');
  if (!config.instagram.username || !config.instagram.password) warnings.push('Instagram credentials belum lengkap: upload akan gagal/DRY_RUN tetap aman.');
  if (!config.dryRun) warnings.push('DRY_RUN=false: command upload dan scheduler dapat melakukan publish sungguhan.');
  return warnings;
}
