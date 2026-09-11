import { getState } from './state.js';
export function createCommandRouter() {
  let plugins = [];
  return {
    setPlugins(next) { plugins = next || []; },
    list() { return [...plugins]; },
    resolve(name) {
      const plugin = plugins.find(p => p.name === name || p.aliases?.includes(name));
      if (plugin && plugin.nonDisableable !== true && getState().disabledPlugins.includes(plugin.name)) return null;
      return plugin;
    },
    help(prefix) {
      return plugins
        .filter(p => p.hidden !== true && (p.nonDisableable === true || !getState().disabledPlugins.includes(p.name)))
        .map(p => `${prefix}${p.usage || p.name}${p.help ? ` — ${p.help}` : ''}`);
    },
    disabled() { return [...getState().disabledPlugins]; }
  };
}
