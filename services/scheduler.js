import cron from 'node-cron';
import { config } from '../lib/config.js';
import { getState, getDailyCount, recordPost } from '../lib/state.js';
import { buildNexoraContent } from './content.js';
import { renderSlides } from './media.js';
import { uploadPhoto } from './instagram.js';

let tasks = [];
let running = false;

export function startScheduler() {
  stopScheduler();
  for (const slot of config.slots) {
    const [hour, minute] = slot.split(':').map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) continue;
    const expr = `${minute} ${hour} * * *`;
    tasks.push(cron.schedule(expr, () => runScheduledPost(slot).catch(e => console.error('[SCHEDULER]', e.message)), { timezone: config.timezone }));
  }
}

export function stopScheduler() { tasks.forEach(t => t.stop()); tasks = []; }

export async function runScheduledPost(slot = 'manual') {
  if (running) return { skipped: true, reason: 'already-running' };
  const state = getState();
  if (!state.autoUpload && slot !== 'manual') return { skipped: true, reason: 'autoupload-off' };
  if (getDailyCount() >= config.maxDailyPosts) return { skipped: true, reason: 'daily-limit' };
  running = true;
  try {
    const content = await buildNexoraContent({ slot });
    const media = await renderSlides(content);
    const result = await uploadPhoto(media, `${content.caption}\n\n${content.hashtags.join(' ')}`);
    await recordPost({ slot, literacyId: content.literacyId, pillar: content.pillar, result });
    return { content, media, result };
  } finally { running = false; }
}
