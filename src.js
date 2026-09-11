import 'dotenv/config';
import readline from 'node:readline';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';

import { serializeMessage } from './serializer.js';
import { parseCommand } from './lib/parser.js';
import { loadPlugins } from './lib/plugin-loader.js';
import { config, validateConfig } from './lib/config.js';
import { getState, incrementStat, initState } from './lib/state.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';
import {
  audit,
  checkCommandCooldown,
  checkRateLimit,
  isAllowedContext,
  isOwner
} from './lib/security.js';
import {
  canProcessMessage,
  canUsePlugin,
  getAccessMode,
  isPremium,
  roleOf
} from './lib/access.js';
import { createCommandRouter } from './lib/command-router.js';

const logger = P({ level: process.env.LOG_LEVEL || 'info' });
const router = createCommandRouter();
const bot = {
  connected: false,
  startedAt: Date.now(),
  reconnects: 0,
  socket: null,
  authMode: config.auth.mode,
  userJid: null,
  accessMode: getAccessMode(config)
};

let plugins = [];
let reconnectTimer = null;
let stopping = false;
let reconnectDelay = config.reconnect.initialDelay;
let reconnectAttempts = 0;

await initState();
bot.accessMode = getAccessMode(config);
plugins = await loadPlugins();
router.setPlugins(plugins);
startScheduler();

for (const warning of validateConfig()) console.warn(`[CONFIG] ${warning}`);
console.log(`[PLUGIN] ${plugins.map(plugin => plugin.name).join(', ')}`);
console.log(`[AUTH] mode=${bot.authMode}`);

async function reloadPlugins() {
  plugins = await loadPlugins();
  router.setPlugins(plugins);
  console.log(`[PLUGIN] reloaded: ${plugins.map(plugin => plugin.name).join(', ')}`);
  return plugins.length;
}

async function promptPhoneIfMissing() {
  if (config.auth.pairingPhone) return config.auth.pairingPhone;
  if (!process.stdin.isTTY) throw new Error('AUTH_MODE=pairing memerlukan PAIRING_PHONE.');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise(resolve => rl.question('Masukkan nomor WhatsApp (tanpa +): ', resolve));
    const phone = String(answer).replace(/\D/g, '');
    if (!phone) throw new Error('Nomor pairing tidak valid.');
    return phone;
  } finally {
    rl.close();
  }
}

async function getWaVersion() {
  try {
    const latest = await fetchLatestWaWebVersion();
    if (latest?.version) {
      console.log(`[WA] Web version=${latest.version.join('.')} latest=${latest.isLatest}`);
      return latest.version;
    }
  } catch (error) {
    console.warn(`[WA] gagal mengambil Web version terbaru: ${error.message}`);
  }
  return undefined;
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(config.auth.authDir);
  const version = await getWaVersion();
  const socketOptions = {
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false
  };
  if (version) socketOptions.version = version;

  const sock = makeWASocket(socketOptions);
  bot.socket = sock;
  sock.ev.on('creds.update', saveCreds);

  if (bot.authMode === 'pairing' && !state.creds.registered) {
    try {
      const phone = await promptPhoneIfMissing();
      const code = await sock.requestPairingCode(phone);
      console.log(`[WA] PAIRING CODE: ${code?.match(/.{1,4}/g)?.join('-') || code}`);
      await audit('pairing_code_requested');
    } catch (error) {
      console.error('[WA] pairing gagal:', error.message);
    }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && bot.authMode === 'qr') {
      console.log('[WA] Scan QR:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      bot.connected = true;
      bot.reconnects = 0;
      reconnectAttempts = 0;
      reconnectDelay = config.reconnect.initialDelay;
      bot.userJid = sock.user?.id || state.creds.me?.id || null;
      console.log(`[WA] CONNECTED${bot.userJid ? ` as ${bot.userJid}` : ''}`);
      await audit('connected', { userJid: bot.userJid });
    }

    if (connection === 'close') {
      bot.connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      await audit('disconnected', { code });
      if (!stopping && config.reconnect.enabled && code !== DisconnectReason.loggedOut) scheduleReconnect();
      else if (code === DisconnectReason.loggedOut) console.log('[WA] Logged out.');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages || []) {
      let serialized;
      try {
        if (!msg?.message) continue;

        serialized = await serializeMessage(sock, msg, config, bot);

        if (!canProcessMessage(serialized, bot, config)) {
          await audit('blocked_mode', {
            sender: serialized.sender,
            candidates: serialized.identity.all,
            fromMe: serialized.isFromMe,
            mode: getAccessMode(config)
          });
          await incrementStat('blocked');
          continue;
        }

        if (serialized.text.length > config.security.maxCommandLength) continue;

        const parsed = parseCommand(serialized.text, config.prefix);
        if (!parsed || !isAllowedContext(serialized, config)) continue;

        const premium = isPremium(serialized.identity.all, config);
        const rate = checkRateLimit(serialized.sender, config, { premium });
        if (!rate.allowed) {
          await serialized.reply({ text: 'Terlalu banyak command. Coba lagi sebentar.' });
          continue;
        }

        const cooldown = checkCommandCooldown(serialized.sender, config);
        if (!cooldown.allowed) continue;

        const plugin = router.resolve(parsed.command);
        if (!plugin) {
          await serialized.reply({ text: `Command tidak dikenal. Ketik ${config.prefix}menu help` });
          continue;
        }

        if (!canUsePlugin(plugin, serialized.sender, config, bot, serialized)) {
          const role = roleOf(serialized.sender, config, serialized);
          await audit('access_denied', {
            sender: serialized.sender,
            candidates: serialized.identity.all,
            command: parsed.command,
            role
          });
          const message = getState().maintenance && !['owner', 'admin'].includes(role)
            ? 'Bot sedang maintenance.'
            : 'Kamu tidak memiliki izin untuk command ini.';
          await serialized.reply({ text: message });
          continue;
        }

        await audit('command', {
          sender: serialized.sender,
          candidates: serialized.identity.all,
          command: parsed.command,
          role: roleOf(serialized.sender, config, serialized),
          group: serialized.isGroup ? serialized.group?.id : null
        });
        await incrementStat('commands');

        await plugin.execute({
          sock,
          m: serialized,
          args: parsed.args,
          rawArgs: parsed.rawArgs,
          prefix: config.prefix,
          bot,
          config,
          router,
          reloadPlugins,
          isOwner: jid => isOwner(jid, config),
          accessMode: getAccessMode(config),
          role: roleOf(serialized.sender, config, serialized),
          isPremium: premium
        });
      } catch (error) {
        console.error('[MESSAGE]', error);
        await incrementStat('errors');
        try {
          const replyMessage = serialized || await serializeMessage(sock, msg, config, bot);
          await replyMessage.reply({ text: `Terjadi error: ${error?.message || String(error)}` });
        } catch (replyError) {
          console.error('[REPLY_ERROR]', replyError);
        }
      }
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer || stopping || reconnectAttempts >= config.reconnect.maxAttempts) return;
  reconnectAttempts += 1;
  bot.reconnects += 1;
  const delay = Math.min(reconnectDelay, config.reconnect.maxDelay);
  console.log(`[WA] reconnect #${reconnectAttempts} dalam ${delay}ms`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, config.reconnect.maxDelay);
    try {
      await start();
    } catch (error) {
      console.error('[WA] reconnect failed:', error.message);
      scheduleReconnect();
    }
  }, delay);
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  stopScheduler();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  await audit('shutdown', { signal });
  try { bot.socket?.end?.(new Error('shutdown')); } catch {}
  setTimeout(() => process.exit(0), 250);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', error => console.error('[FATAL]', error));
process.on('unhandledRejection', error => console.error('[UNHANDLED]', error));

await start();
