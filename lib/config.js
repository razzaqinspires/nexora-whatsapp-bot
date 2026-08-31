import 'dotenv/config';

const bool = (v, fallback = false) => {
  if (v == null || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

export const config = {
  prefix: process.env.BOT_PREFIX || '/',
  ownerJids: (process.env.OWNER_JIDS || '').split(',').map(s => s.trim()).filter(Boolean),
  timezone: process.env.NEXORA_TIMEZONE || 'Asia/Jakarta',
  slots: (process.env.NEXORA_SLOTS || '09:00,13:00,19:00').split(',').map(s => s.trim()).filter(Boolean),
  autoUploadDefault: bool(process.env.NEXORA_AUTOUPLOAD, false),
  dryRun: bool(process.env.DRY_RUN, true),
  maxDailyPosts: Number(process.env.MAX_DAILY_POSTS || 3),
  ai: {
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini'
  },
  instagram: {
    username: process.env.IG_USERNAME || '',
    password: process.env.IG_PASSWORD || '',
    autoLogin: bool(process.env.IG_AUTO_LOGIN, false),
    sessionFile: process.env.IG_SESSION_FILE || 'data/instagram-session.json'
  }
};

export function isOwner(jid) {
  if (!config.ownerJids.length) return true;
  return config.ownerJids.includes(jid);
}
