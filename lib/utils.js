export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const pad = n => String(n).padStart(2, '0');
export function today(tz = 'Asia/Jakarta') {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date());
}
export function nowText(tz = 'Asia/Jakarta') {
  return new Intl.DateTimeFormat('id-ID', { timeZone: tz, dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
}
export function uid(prefix = 'NX') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
