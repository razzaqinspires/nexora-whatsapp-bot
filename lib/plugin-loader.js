import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadPlugins(dir = path.resolve('plugins')) {
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.js')).sort();
  const plugins = [];
  for (const file of files) {
    const url = `${pathToFileURL(path.join(dir, file)).href}?t=${Date.now()}`;
    const mod = await import(url);
    if (mod.default?.name && typeof mod.default.execute === 'function') plugins.push(mod.default);
  }
  return plugins;
}
