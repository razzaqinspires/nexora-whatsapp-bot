import fs from 'node:fs/promises';
import path from 'node:path';

const file = './data/state.json';
let state = { autoUpload: false, daily: {}, history: [], settings: { version: 3 } };

export async function initState() {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try { state = JSON.parse(await fs.readFile(file, 'utf8')); } catch { await persist(); }
  return state;
}

async function persist() {
  await fs.writeFile(file, JSON.stringify(state, null, 2), 'utf8');
}

export function getState() { return state; }
export async function setAutoUpload(enabled) { state.autoUpload = Boolean(enabled); await persist(); return state.autoUpload; }
export async function recordPost(item) {
  const day = new Date().toISOString().slice(0, 10);
  state.daily[day] = (state.daily[day] || 0) + 1;
  state.history.unshift({ ...item, at: new Date().toISOString() });
  state.history = state.history.slice(0, 100);
  await persist();
}
export function getDailyCount() { return state.daily[new Date().toISOString().slice(0, 10)] || 0; }
