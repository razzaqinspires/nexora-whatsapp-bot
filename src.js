import 'dotenv/config';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { serializeMessage } from './serializer.js';
import { parseCommand } from './lib/parser.js';
import { loadPlugins } from './lib/plugin-loader.js';
import { config } from './lib/config.js';
import { initState } from './lib/state.js';
import { startScheduler } from './services/scheduler.js';

const logger = P({ level: process.env.LOG_LEVEL || 'info' });
const authDir = process.env.AUTH_DIR || './session/whatsapp';
const bot = { connected: false, startedAt: Date.now() };
let plugins = await loadPlugins();

await initState();
startScheduler();
console.log(`[PLUGIN] ${plugins.map(p => p.name).join(', ')}`);

async function reloadPlugins() {
  plugins = await loadPlugins();
  console.log(`[PLUGIN] reloaded: ${plugins.map(p => p.name).join(', ')}`);
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const sock = makeWASocket({
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    logger,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === 'open') { bot.connected = true; console.log('[WA] CONNECTED'); }
    if (connection === 'close') {
      bot.connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) setTimeout(start, 3000);
      else console.log('[WA] logged out');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages || []) {
      if (!msg?.message || msg.key?.fromMe) continue;
      const m = serializeMessage(sock, msg);
      const parsed = parseCommand(m.text, config.prefix);
      if (!parsed) continue;
      const plugin = plugins.find(p => p.name === parsed.command || p.aliases?.includes(parsed.command));
      if (!plugin) continue;
      try {
        await plugin.execute({ sock, m, args: parsed.args, rawArgs: parsed.rawArgs, prefix: config.prefix, bot, reloadPlugins });
      } catch (error) {
        console.error(`[PLUGIN:${plugin.name}]`, error);
        await m.reply(`Terjadi error pada /${parsed.command}: ${error.message}`);
      }
    }
  });
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
await start();
