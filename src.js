import 'dotenv/config';
import readline from 'node:readline';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { serializeMessage } from './serializer.js';
import { parseCommand } from './lib/parser.js';
import { loadPlugins } from './lib/plugin-loader.js';
import { config, validAuthMode } from './lib/config.js';
import { initState } from './lib/state.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';
import { audit, checkCommandCooldown, checkRateLimit, isAllowedContext, isOwner } from './lib/security.js';

const logger = P({ level: process.env.LOG_LEVEL || 'info' });
const bot = {
  connected: false,
  startedAt: Date.now(),
  reconnects: 0,
  socket: null,
  authMode: validAuthMode
};
let plugins = [];
let reconnectTimer = null;
let stopping = false;
let reconnectDelay = config.reconnect.initialDelay;

await initState();
plugins = await loadPlugins();
startScheduler();
console.log(`[PLUGIN] ${plugins.map(p => p.name).join(', ')}`);
console.log(`[AUTH] mode=${bot.authMode}`);

async function reloadPlugins() {
  plugins = await loadPlugins();
  console.log(`[PLUGIN] reloaded: ${plugins.map(p => p.name).join(', ')}`);
  return plugins.length;
}

async function promptPhoneIfMissing() {
  if (config.auth.pairingPhone) return config.auth.pairingPhone;
  if (!process.stdin.isTTY) throw new Error('AUTH_MODE=pairing memerlukan PAIRING_PHONE karena terminal interaktif tidak tersedia.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise(resolve => rl.question('Masukkan nomor WhatsApp (contoh 62812xxxx, tanpa +): ', resolve));
    const phone = String(answer).replace(/\D/g, '');
    if (!phone) throw new Error('Nomor pairing tidak valid.');
    return phone;
  } finally { rl.close(); }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(config.auth.authDir);
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false
  });
  bot.socket = sock;
  sock.ev.on('creds.update', saveCreds);

  if (bot.authMode === 'pairing' && !state.creds.registered) {
    try {
      const phone = await promptPhoneIfMissing();
      const code = await sock.requestPairingCode(phone);
      console.log(`\n[WA] PAIRING CODE: ${code?.match(/.{1,4}/g)?.join('-') || code}`);
      console.log('[WA] WhatsApp > Linked Devices > Link a device > Link with phone number.\n');
      await audit('pairing_code_requested');
    } catch (error) {
      console.error('[WA] pairing code gagal:', error.message);
    }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && bot.authMode === 'qr') {
      console.log('[WA] Scan QR berikut:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      bot.connected = true;
      bot.reconnects = 0;
      reconnectDelay = config.reconnect.initialDelay;
      console.log('[WA] CONNECTED');
      await audit('connected');
    }
    if (connection === 'close') {
      bot.connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      await audit('disconnected', { code });
      if (!stopping && config.reconnect.enabled && code !== DisconnectReason.loggedOut) scheduleReconnect();
      else if (code === DisconnectReason.loggedOut) console.log('[WA] Session logged out. Hapus session jika ingin pairing ulang.');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages || []) {
      if (!msg?.message || msg.key?.fromMe) continue;
      const m = serializeMessage(sock, msg);
      const parsed = parseCommand(m.text, config.prefix);
      if (!parsed) continue;

      if (!isAllowedContext(m, config)) {
        await audit('blocked_context', { sender: m.sender, command: parsed.command });
        continue;
      }
      const rate = checkRateLimit(m.sender, config);
      if (!rate.allowed) {
        await m.reply('Terlalu banyak command. Coba lagi sebentar.');
        continue;
      }
      const cooldown = checkCommandCooldown(m.sender, config);
      if (!cooldown.allowed) continue;

      const plugin = plugins.find(p => p.name === parsed.command || p.aliases?.includes(parsed.command));
      if (!plugin) {
        await m.reply(`Command tidak dikenal. Ketik ${config.prefix}menu help`);
        continue;
      }
      if (plugin.ownerOnly && !isOwner(m.sender, config)) {
        await audit('owner_denied', { sender: m.sender, command: parsed.command });
        await m.reply('Command ini hanya untuk owner bot.');
        continue;
      }
      try {
        await audit('command', { sender: m.sender, command: parsed.command });
        await plugin.execute({ sock, m, args: parsed.args, rawArgs: parsed.rawArgs, prefix: config.prefix, bot, reloadPlugins, isOwner: (jid) => isOwner(jid, config) });
      } catch (error) {
        console.error(`[PLUGIN:${plugin.name}]`, error);
        await audit('plugin_error', { command: plugin.name, error: error.message });
        await m.reply(`Terjadi error pada /${parsed.command}: ${error.message}`);
      }
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer || stopping) return;
  bot.reconnects += 1;
  const delay = Math.min(reconnectDelay, config.reconnect.maxDelay);
  console.log(`[WA] reconnect dalam ${delay} ms...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, config.reconnect.maxDelay);
    try { await start(); } catch (error) { console.error('[WA] reconnect failed:', error.message); scheduleReconnect(); }
  }, delay);
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[SYSTEM] ${signal} -> shutdown`);
  stopScheduler();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  await audit('shutdown', { signal });
  try { bot.socket?.end?.(new Error('shutdown')); } catch {}
  setTimeout(() => process.exit(0), 250);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', async (error) => { console.error('[FATAL]', error); await audit('uncaught_exception', { error: error.message }); });
process.on('unhandledRejection', async (error) => { console.error('[UNHANDLED]', error); await audit('unhandled_rejection', { error: String(error) }); });

await start();
