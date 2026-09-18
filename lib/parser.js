const CONTROL = new Set(['setprefix','prefix','prefixstatus','prefixinfo']);
export function parseCommand(text='', config={}) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  const mode = String(config?.prefixMode || 'single').toLowerCase();
  const configured = mode === 'none' ? [''] : (Array.isArray(config?.prefixes) ? config.prefixes : [config?.prefix || '/']);
  const prefixes = [...new Set(configured.map(String))].sort((a,b)=>b.length-a.length);
  if (mode === 'none') {
    const bootstrap = ['.','!','#','/'].find(p => value.startsWith(p));
    if (bootstrap) { const probe=parseBody(value.slice(bootstrap.length).trim(), bootstrap); if(probe && CONTROL.has(probe.command)) return probe; }
    return parseBody(value, '');
  }
  const prefix = prefixes.find(p => p && value.startsWith(p));
  if (prefix) return parseBody(value.slice(prefix.length).trim(), prefix);
  // Bootstrap controls stay reachable even after a bad persisted prefix config.
  const bootstrap = ['.','!','#','/'].find(p => value.startsWith(p));
  if (bootstrap) {
    const probe = parseBody(value.slice(bootstrap.length).trim(), bootstrap);
    if (probe && CONTROL.has(probe.command)) return probe;
  }
  return null;
}
function parseBody(body, prefix) {
  if (!body) return null;
  const tokens = tokenize(body);
  if (!tokens.length) return null;
  const command = tokens.shift().toLowerCase();
  return { command, args: tokens, rawArgs: tokens.join(' '), body, prefix };
}
export function tokenize(input) {
  const out=[]; let cur='', quote=null, escape=false;
  for (const ch of String(input)) {
    if (escape) { cur += ch; escape=false; continue; }
    if (ch==='\\') { escape=true; continue; }
    if (quote) { if (ch===quote) quote=null; else cur+=ch; continue; }
    if (ch==='"' || ch==="'") { quote=ch; continue; }
    if (/\s/.test(ch)) { if (cur) { out.push(cur); cur=''; } }
    else cur+=ch;
  }
  if (cur) out.push(cur);
  return out;
}
