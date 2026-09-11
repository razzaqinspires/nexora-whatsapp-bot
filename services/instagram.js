import fs from 'node:fs/promises';
import { IgApiClient } from 'instagram-private-api';
import { config } from '../lib/config.js';

let ig = null;
let loggedIn = false;
let loginPromise = null;

async function ensureClient() {
  if (loggedIn && ig) return ig;
  if (loginPromise) return loginPromise;
  loginPromise = (async () => {
    if (!config.instagram.username || !config.instagram.password) throw new Error('Instagram belum dikonfigurasi di .env');
    const client = new IgApiClient();
    client.state.generateDevice(config.instagram.username);
    try {
      await client.state.deserialize(JSON.parse(await fs.readFile(config.instagram.sessionFile, 'utf8')));
      await client.account.currentUser();
    } catch {
      await client.simulate.preLoginFlow();
      await client.account.login(config.instagram.username, config.instagram.password);
      await client.simulate.postLoginFlow();
      await fs.mkdir('./auth', { recursive: true });
      await fs.writeFile(config.instagram.sessionFile, JSON.stringify(await client.state.serialize()));
    }
    ig = client;
    loggedIn = true;
    return ig;
  })().finally(() => { loginPromise = null; });
  return loginPromise;
}

export async function instagramStatus() {
  return {
    configured: Boolean(config.instagram.username && config.instagram.password),
    loggedIn,
    username: config.instagram.username || null,
    mode: config.dryRun ? 'dry-run' : 'private-api'
  };
}

export async function loginInstagram() { await ensureClient(); return instagramStatus(); }

export async function uploadPhoto(mediaPaths, caption) {
  const files = Array.isArray(mediaPaths) ? mediaPaths : [mediaPaths];
  if (config.dryRun) return { dryRun: true, files, caption, type: files.length > 1 ? 'carousel' : 'photo' };
  const client = await ensureClient();
  if (files.length === 1) {
    const result = await client.publish.photo({ file: await fs.readFile(files[0]), caption });
    return { dryRun: false, type: 'photo', mediaId: result?.media?.pk || result?.media?.id || null };
  }
  const result = await client.publish.album({ items: await Promise.all(files.map(async file => ({ file: await fs.readFile(file) }))), caption });
  return { dryRun: false, type: 'carousel', mediaId: result?.media?.pk || result?.media?.id || null };
}

export async function uploadInstagramMedia(file, caption = '', type = 'image') {
  if (type === 'image') return uploadPhoto(file, caption);
  if (config.dryRun) return { dryRun: true, file, caption, type: 'video' };
  const client = await ensureClient();
  const result = await client.publish.video({ video: await fs.readFile(file), caption });
  return { dryRun: false, type: 'video', mediaId: result?.media?.pk || result?.media?.id || null };
}
