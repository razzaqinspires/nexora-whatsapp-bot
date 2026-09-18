import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';

const file = './data/state.json';
const defaults = {
  version: 15.0,
  autoUpload: config.automation.autoUploadDefault,
  accessMode: config.accessMode,
  maintenance: config.security.maintenanceDefault,
  admins: [...config.security.adminJids],
  premiumUsers: [],
  disabledPlugins: [],
  schedulerPaused: false,
  prefix: { mode: config.prefixMode === 'none' ? 'none' : (config.prefixMode === 'multi' ? 'multi' : 'single'), prefixes: config.prefixMode === 'none' ? [''] : (config.prefixMode === 'multi' ? ['.', '!', '#', '/'] : [config.prefix || '/']) },
  posts: [],
  stats: { commands: 0, errors: 0, blocked: 0, jobs: 0, jobErrors: 0, uploads: 0, uploadErrors: 0 },
  users: {},
  groupSettings: {},
  premiumUntil: {},
  aiChats: {},
  quests: {},
  guilds: {},
  transactions: [],
  achievements: {},
  daily: {},
  rpg: { version: 15.0 },
  jadibots: {},
  menu: { showDescription: true, showArgs: true, numbered: false, sort: 'category', type: 'buttons', font: 'normal', widgets: { stats: true, novel: false, links: false, user: true, premium: true, status: true }, hidden: [], shown: [], category: 'all', replaces: {} },
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
      posts: Array.isArray(saved.posts) ? saved.posts : [],
      users: saved.users && typeof saved.users === 'object' ? saved.users : {},
      groupSettings: saved.groupSettings && typeof saved.groupSettings === 'object' ? saved.groupSettings : {},
      premiumUntil: saved.premiumUntil && typeof saved.premiumUntil === 'object' ? saved.premiumUntil : {},
      aiChats: saved.aiChats && typeof saved.aiChats === 'object' ? saved.aiChats : {}
    };
    if (state.prefix?.mode === 'multi' && (!Array.isArray(state.prefix.prefixes) || state.prefix.prefixes.length === 0)) {
      state.prefix = { mode: 'multi', prefixes: ['.', '!', '#', '/'] };
    }
    state.version = 15.0;
    state.quests ||= {};
    state.guilds ||= {};
    state.transactions ||= [];
    state.achievements ||= {};
    state.daily ||= {};
    state.rpg ||= { version: 15.0 }; state.rpg.version = 15.0;
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
export async function setPremiumUntil(jid, until) { state.premiumUntil ||= {}; if (until) state.premiumUntil[jid] = until; else delete state.premiumUntil[jid]; await persist(); }
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
  const d = new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return state.posts.filter(p => { if (p.result?.dryRun === true || !p.at) return false; const pd=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.at)); return pd===d; }).length;
}
export async function incrementStat(key) { state.stats[key] = (state.stats[key] || 0) + 1; await persist(); }

export async function setPrefixConfig(prefix) {
  const mode = ['single','multi','none'].includes(prefix?.mode) ? prefix.mode : 'single';
  const prefixes = mode === 'none' ? [''] : [...new Set((Array.isArray(prefix?.prefixes) ? prefix.prefixes : ['/']).map(String).map(x => x.trim()).filter(Boolean))].slice(0, 10);
  if (mode !== 'none' && !prefixes.length) throw new Error('Prefix tidak boleh kosong.');
  state.prefix = { mode, prefixes };
  await persist();
  return state.prefix;
}

export async function persistJadibot(jid, data) { state.jadibots ||= {}; if (data) state.jadibots[jid] = data; else delete state.jadibots[jid]; await persist(); return state.jadibots; }

export async function persistMenuConfig(menu) { state.menu = menu; await persist(); return state.menu; }

export async function persistGamification() { await persist(); return state; }

export async function exportState() { return JSON.stringify(state, null, 2); }
