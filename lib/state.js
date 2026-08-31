import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve('data/state.json');
const defaults = {
  autoUpload: { ig: false },
  generated: [],
  published: [],
  stats: { generated: 0, published: 0, failed: 0 },
  lastRun: null,
  daily: { date: null, count: 0 }
};

let state = structuredClone(defaults);

export async function initState() {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    state = { ...defaults, ...(JSON.parse(await fs.readFile(file, 'utf8')) || {}) };
  } catch {
    await saveState();
  }
  return state;
}

export function getState() { return state; }
export async function saveState() { await fs.writeFile(file, JSON.stringify(state, null, 2)); }
export async function patchState(patch) { Object.assign(state, patch); await saveState(); return state; }
