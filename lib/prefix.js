import { getState, setPrefixConfig } from './state.js';

const DEFAULT_MULTI = ['.', '!', '#', '/'];
const normalize = list => [...new Set((list || []).map(v => String(v).trim()).filter(Boolean))];

export function getPrefixConfig(config = {}) {
  const saved = getState()?.prefix;
  if (saved?.mode) {
    const prefixes = saved.mode === 'none' ? [''] : normalize(saved.prefixes).length ? normalize(saved.prefixes) : DEFAULT_MULTI;
    return { mode: saved.mode, prefixes };
  }
  const mode = ['single','multi','none'].includes(String(config.prefixMode || '').toLowerCase()) ? String(config.prefixMode).toLowerCase() : 'single';
  const prefixes = mode === 'none' ? [''] : mode === 'multi' ? DEFAULT_MULTI : [String(config.prefix || '/')];
  return { mode, prefixes: normalize(prefixes) };
}

export async function configurePrefix(mode, prefixes = []) {
  mode = String(mode || '').trim().toLowerCase();
  const list = normalize(prefixes);
  if (mode === 'single') {
    const p = list[0] || '';
    if (!p) throw new Error('Mode single wajib memiliki prefix. Contoh: setprefix single .');
    if (/\s/.test(p) || p.length > 3) throw new Error('Prefix single harus 1-3 karakter tanpa spasi.');
    return setPrefixConfig({ mode, prefixes: [p] });
  }
  if (mode === 'multi') {
    const effective = list.length ? list : DEFAULT_MULTI;
    if (effective.length > 10 || effective.some(x => /\s/.test(x) || x.length > 3)) throw new Error('Prefix multi maksimal 10 item; tiap prefix 1-3 karakter tanpa spasi.');
    return setPrefixConfig({ mode, prefixes: effective });
  }
  if (mode === 'none') return setPrefixConfig({ mode, prefixes: [''] });
  throw new Error('Mode prefix hanya: single, multi, atau none.');
}
export function getPrefixes(config) { return getPrefixConfig(config).prefixes; }
export const DEFAULT_PREFIXES = DEFAULT_MULTI;
