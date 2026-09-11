export function parseCommand(text = '', prefix = '/') {
  const value = String(text).trim();
  if (!value.startsWith(prefix)) return null;
  const body = value.slice(prefix.length).trim();
  if (!body) return null;
  const tokens = tokenize(body);
  if (!tokens.length) return null;
  const command = tokens.shift().toLowerCase();
  return { command, args: tokens, rawArgs: tokens.join(' '), body };
}
function tokenize(input) {
  const out=[]; let cur=''; let quote=null; let escape=false;
  for (const ch of input) { if (escape) { cur+=ch; escape=false; continue; } if (ch==='\\') { escape=true; continue; } if (quote) { if(ch===quote) quote=null; else cur+=ch; continue; } if(ch==='"'||ch==="'") { quote=ch; continue; } if(/\s/.test(ch)){ if(cur){out.push(cur);cur='';} } else cur+=ch; }
  if(cur) out.push(cur); return out;
}
