import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadPlugins() {
  const dir = path.resolve('./plugins');
  await fs.mkdir(dir, { recursive: true });
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.js')).sort();
  const loaded = [];
  for (const file of files) {
    const url = `${pathToFileURL(path.join(dir, file)).href}?v=${Date.now()}`;
    const mod = await import(url);
    const plugin = mod.default || mod.plugin;
    if (!plugin?.name || typeof plugin.execute !== 'function') continue;
    loaded.push(plugin);
  }
  return loaded;
}
