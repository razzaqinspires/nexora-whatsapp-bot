export function parseCommand(text = '', prefix = '/') {
  const value = String(text).trim();
  if (!value.startsWith(prefix)) return null;
  const body = value.slice(prefix.length).trim();
  if (!body) return null;
  const parts = body.split(/\s+/);
  const command = parts.shift().toLowerCase();
  return { command, args: parts, rawArgs: parts.join(' ') };
}
