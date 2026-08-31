import cron from 'node-cron';
import { config } from '../lib/config.js';
import { getState, saveState } from '../lib/state.js';
import { today } from '../lib/utils.js';
import { createContent } from './ai.js';
import { makeCarouselImages } from './media.js';
import { uploadPhoto } from './instagram.js';

let jobs = [];
let running = false;

export async function runSlot(slot, reason = 'manual') {
  if (reason === 'schedule' && !getState().autoUpload.ig) return { skipped: true, reason: 'autoupload-off' };
  if (running) return { skipped: true, reason: 'already-running' };
  const s = getState();
  const d = today(config.timezone);
  if (s.daily?.date !== d) s.daily = { date: d, count: 0 };
  if (s.daily.count >= config.maxDailyPosts) return { skipped: true, reason: 'daily-limit' };
  running = true;
  try {
    const content = await createContent();
    const images = await makeCarouselImages(content);
    const item = { ...content, slot, reason, media: images, createdAt: new Date().toISOString() };
    s.generated.push(item);
    s.stats.generated += 1;
    s.daily.count += 1;
    s.lastRun = item.createdAt;

    // Private API adapter publishes each carousel image independently only as a fallback.
    // Full Instagram carousel publishing is left behind the adapter so it can be swapped safely.
    if (config.dryRun) {
      item.publish = { dryRun: true, images };
    } else {
      item.publish = await uploadPhoto(images, item.caption);
      if (!item.publish?.dryRun) {
        item.status = 'published';
        s.published.push(item);
        s.stats.published += 1;
      }
    }
    await saveState();
    return item;
  } catch (error) {
    s.stats.failed += 1;
    await saveState();
    return { error: error.message };
  } finally {
    running = false;
  }
}

export function startScheduler() {
  stopScheduler();
  for (const slot of config.slots) {
    const [hour, minute] = slot.split(':').map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) continue;
    jobs.push(cron.schedule(`${minute} ${hour} * * *`, () => runSlot(slot, 'schedule'), { timezone: config.timezone }));
  }
  return config.slots;
}
export function stopScheduler() { for (const j of jobs) j.stop(); jobs = []; }
export function schedulerStatus() { return { active: jobs.length > 0, slots: config.slots, timezone: config.timezone, running }; }
