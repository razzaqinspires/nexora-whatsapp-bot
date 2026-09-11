import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

const file = './data/state.json';
const defaults = {
  version: 7,
  autoUpload: config.automation.autoUploadDefault,
  accessMode: config.accessMode,
  maintenance: config.security.maintenanceDefault,
  admins: [...config.security.adminJids],
  premiumUsers: [],
  disabledPlugins: [],
  schedulerPaused: false,
  posts: [],
  stats: { commands: 0, errors: 0, blocked: 0, jobs: 0, jobErrors: 0, uploads: 0, uploadErrors: 0 }
};
let state = structuredClone(defaults);
let writeChain = Promise.resolve();

export async function initState() {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    state = {
      ...structuredClone(defaults),
      ...saved,
      stats: { ...defaults.stats, ...(saved.stats || {}) },
      admins: Array.isArray(saved.admins) ? saved.admins : [...defaults.admins],
      premiumUsers: Array.isArray(saved.premiumUsers) ? saved.premiumUsers : [],
      disabledPlugins: Array.isArray(saved.disabledPlugins) ? saved.disabledPlugins : [],
      posts: Array.isArray(saved.posts) ? saved.posts : []
    };
    state.version = 7;
    await persist();
  } catch {
    await persist();
  }
}

function persist() {
  writeChain = writeChain.then(() => fs.writeFile(file, JSON.stringify(state, null, 2)));
  return writeChain;
}

export function getState() { return state; }
export async function setAutoUpload(value) { state.autoUpload = Boolean(value); await persist(); }
export async function setAccessMode(value) { state.accessMode = value; await persist(); }
export async function setMaintenance(value) { state.maintenance = Boolean(value); await persist(); }
export async function setSchedulerPaused(value) { state.schedulerPaused = Boolean(value); await persist(); }
export async function setAdmins(admins) { state.admins = [...new Set(admins)]; await persist(); }
export async function setPremiumUsers(users) { state.premiumUsers = [...new Set(users)]; await persist(); }
export async function setPluginDisabled(name, disabled) {
  const set = new Set(state.disabledPlugins);
  disabled ? set.add(name) : set.delete(name);
  state.disabledPlugins = [...set];
  await persist();
}
export async function recordPost(item) {
  state.posts.push({ ...item, at: new Date().toISOString() });
  if (state.posts.length > 500) state.posts = state.posts.slice(-500);
  await persist();
}
export function getDailyCount() {
  const d = new Date().toISOString().slice(0, 10);
  return state.posts.filter(p => String(p.at || '').startsWith(d) && p.result?.dryRun !== true).length;
}
export async function incrementStat(key) { state.stats[key] = (state.stats[key] || 0) + 1; await persist(); }
export async function exportState() { return JSON.stringify(state, null, 2); }
