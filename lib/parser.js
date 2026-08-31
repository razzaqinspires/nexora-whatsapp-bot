export function parseCommand(text, prefix = '/') {
  const input = String(text || '').trim();
  if (!input.startsWith(prefix)) return null;
  const body = input.slice(prefix.length).trim();
  if (!body) return null;
  const parts = body.split(/\s+/);
  const command = parts.shift().toLowerCase();
  return { command, args: parts, rawArgs: parts.join(' ') };
}
