import os from 'node:os';
import { getState, getDailyCount } from './state.js';
export function healthSnapshot(bot, config) {
  return { version: config.version, connected: Boolean(bot.connected), jid: bot.userJid || null, uptimeSec: Math.floor((Date.now()-bot.startedAt)/1000), reconnects: bot.reconnects, accessMode: bot.accessMode || config.accessMode, autoUpload: getState().autoUpload, dailyPosts: getDailyCount(), memoryMB: Math.round(process.memoryUsage().rss/1024/1024), load: os.loadavg?.()[0] ?? 0, node: process.version };
}
