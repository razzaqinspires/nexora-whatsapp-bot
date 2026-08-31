import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { IgApiClient } from 'instagram-private-api';
import { config } from '../lib/config.js';

let ig = null;
let loggedIn = false;

async function ensureClient() {
  if (loggedIn && ig) return ig;
  if (!config.instagram.username || !config.instagram.password) throw new Error('Instagram belum dikonfigurasi: isi IG_USERNAME dan IG_PASSWORD di .env');
  ig = new IgApiClient();
  ig.state.generateDevice(config.instagram.username);
  await fs.mkdir(path.dirname(config.instagram.sessionFile), { recursive: true });
  try {
    await ig.state.deserialize(JSON.parse(await fs.readFile(config.instagram.sessionFile, 'utf8')));
    await ig.account.currentUser();
  } catch {
    await ig.simulate.preLoginFlow();
    await ig.account.login(config.instagram.username, config.instagram.password);
    process.nextTick(() => ig?.simulate?.postLoginFlow?.());
    await fs.writeFile(config.instagram.sessionFile, JSON.stringify(await ig.state.serialize()));
  }
  loggedIn = true;
  return ig;
}

export async function instagramStatus() {
  return { configured: Boolean(config.instagram.username && config.instagram.password), loggedIn, username: config.instagram.username || null, mode: config.dryRun ? 'dry-run' : 'private-api' };
}

export async function loginInstagram() { await ensureClient(); return instagramStatus(); }

export async function uploadPhoto(mediaPaths, caption) {
  const files = Array.isArray(mediaPaths) ? mediaPaths : [mediaPaths];
  if (config.dryRun) return { dryRun: true, files, caption };
  const client = await ensureClient();
  if (files.length === 1) {
    const result = await client.publish.photo({ file: await fs.readFile(files[0]), caption });
    return { dryRun: false, type: 'photo', mediaId: result?.media?.pk || result?.media?.id || null };
  }
  const result = await client.publish.album({
    items: files.map(file => ({ file: fsSync.readFileSync(file) })),
    caption
  });
  return { dryRun: false, type: 'carousel', mediaId: result?.media?.pk || result?.media?.id || null };
}

