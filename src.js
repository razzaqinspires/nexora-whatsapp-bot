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

import { serializeMessage, attachSerializerRuntime } from './serializer.js';
import { parseCommand } from './lib/parser.js';
import { getPrefixConfig } from './lib/prefix.js';
import { loadPlugins } from './lib/plugin-loader.js';
import { config, validateConfig } from './lib/config.js';
import { getState, incrementStat, initState } from './lib/state.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';
import { startRuntimeWeb, stopRuntimeWeb } from './services/runtime-web.js';
import { ensureYtDlp } from './services/runtime-deps.js';
import {
  audit,
  checkCommandCooldown,
  checkRateLimit,
  isAllowedContext,
  isOwner,
  sameUser
} from './lib/security.js';
import {
  canProcessMessage,
  canUsePlugin,
  getAccessMode,
  isPremium,
  roleOf
} from './lib/access.js';
import { createCommandRouter } from './lib/command-router.js';
import { addActivity, levelNotifyEnabled } from './lib/gamification.js';
import { renderLevelUpCanvas } from './services/canvas.js';
import { remember } from './services/memory.js';
import { setJadibotHandler } from './services/jadibot.js';

const logger = P({ level: process.env.LOG_LEVEL || 'info' });
const router = createCommandRouter();
setJadibotHandler(async ({sock: childSock, msg, ownerJid}) => {
  if (!msg?.message) return;
  const childBot={socket:childSock,userJid:childSock.user?.id||null,connected:true};
  const sm=await serializeMessage(childSock,msg,config,childBot);
  const pc=getPrefixConfig(config);
  const parsed=parseCommand(sm.text,{...config,prefixMode:pc.mode,prefixes:pc.prefixes,prefix:pc.prefixes?.[0]||''});
  if(!parsed || !isAllowedContext(sm,config)) return;
  const plugin=router.resolve(parsed.command);
  if(!plugin) return sm.reply({text:`Command tidak dikenal: ${parsed.command}`});
  const isSessionOwner=sm.identity?.all?.some(x=>sameUser(x,ownerJid));
  if(plugin.ownerOnly && !isSessionOwner) return sm.reply({text:'Command owner hanya dapat digunakan oleh pemilik jadibot.'});
  if(plugin.ownerOnly || plugin.adminOnly || plugin.premiumOnly) { sm.isPremium=true; sm.isOwner=Boolean(isSessionOwner); sm.role=isSessionOwner?'owner':'premium'; }
  await plugin.execute({sock:childSock,m:sm,args:parsed.args,rawArgs:parsed.rawArgs,prefix:parsed.prefix,bot:childBot,config,router,reloadPlugins,isOwner:jid=>isOwner(jid,config),accessMode:getAccessMode(config),role:sm.role||'premium',isPremium:true});
});
const eventMonitor = { enabled: true, counts: new Map(), last: null };
function recordEvent(name, data = {}) { eventMonitor.counts.set(name, (eventMonitor.counts.get(name) || 0) + 1); eventMonitor.last = { name, at: new Date().toISOString(), keys: Object.keys(data || {}) }; }
const reconnectConfig = config.reconnect ?? { enabled: true, initialDelay: 3000, maxDelay: 60000, maxAttempts: 20 };

const bot = {
  connected: false,
  startedAt: Date.now(),
  reconnects: 0,
  socket: null,
  authMode: config.auth.mode,
  userJid: null,
  accessMode: getAccessMode(config),
  eventMonitor
};

let plugins = [];
let reconnectTimer = null;
let stopping = false;
let reconnectDelay = reconnectConfig.initialDelay;
let reconnectAttempts = 0;

await initState();
  startRuntimeWeb();
  ensureYtDlp({ background: true }).catch(() => {});
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
  attachSerializerRuntime(sock);
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
      reconnectDelay = reconnectConfig.initialDelay;
      bot.userJid = sock.user?.id || state.creds.me?.id || null;
      console.log(`[WA] CONNECTED${bot.userJid ? ` as ${bot.userJid}` : ''}`);
      await audit('connected', { userJid: bot.userJid });
    }

    if (connection === 'close') {
      bot.connected = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      await audit('disconnected', { code });
      if (!stopping && reconnectConfig.enabled && code !== DisconnectReason.loggedOut) scheduleReconnect();
      else if (code === DisconnectReason.loggedOut) console.log('[WA] Logged out.');
    }
  });

  const events = ['connection.update','messages.update','messages.delete','messages.reaction','groups.upsert','groups.update','group-participants.update','contacts.upsert','contacts.update','chats.upsert','chats.update','presence.update','lid-mapping.update','call'];
  for (const eventName of events) sock.ev.on(eventName, data => recordEvent(eventName, data));
  sock.ev.on('group-participants.update', async ev => { try { const settings=getState().groupSettings?.[ev.id]||{}; if(!settings.welcome&&!settings.leave)return; const added=ev.action==='add'&&settings.welcome; const removed=ev.action==='remove'&&settings.leave; if(!added&&!removed)return; const list=(ev.participants||[]); const text=added?`Selamat datang ${list.map(x=>`@${String(x).split('@')[0]}`).join(' ')} 👋`:`Sampai jumpa ${list.map(x=>`@${String(x).split('@')[0]}`).join(' ')}.`; await sock.sendMessage(ev.id,{text,mentions:list}); } catch(e){ logger.warn({err:e.message},'group notification failed'); } });

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

        const prefixConfig = getPrefixConfig(config);
        const parsed = parseCommand(serialized.text, {
          ...config,
          prefixMode: prefixConfig.mode,
          prefixes: prefixConfig.prefixes,
          prefix: prefixConfig.prefixes?.[0] || ''
        });
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
          const suggestions = router.suggest(parsed.command, 3);
          const scored = suggestions.map(x => { const a=String(parsed.command).toLowerCase(), b=String(x.name).toLowerCase(); let d=0; const max=Math.max(a.length,b.length); const dp=Array.from({length:a.length+1},(_,i)=>[i]); for(let j=1;j<=b.length;j++)dp[0][j]=j; for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); d=Math.max(0,Math.round((1-dp[a.length][b.length]/max)*100)); return `${x.name} (${d}%)`; });
          await serialized.reply({ text: `Command tidak dikenal: *${parsed.command}*\n${scored.length?`Mungkin maksudmu: ${scored.join(', ')}`:'Ketik menu untuk daftar command.'}` });
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
        await remember('command.execute',{command:parsed.command,group:serialized.isGroup?serialized.chat:null},String(serialized.sender||''));

        await plugin.execute({
          sock,
          m: serialized,
          args: parsed.args,
          rawArgs: parsed.rawArgs,
          prefix: parsed?.prefix ?? getPrefixConfig(config).prefixes[0] ?? '',
          bot,
          config,
          router,
          reloadPlugins,
          isOwner: jid => isOwner(jid, config),
          accessMode: getAccessMode(config),
          role: roleOf(serialized.sender, config, serialized),
          isPremium: premium
        });

        const activity = await addActivity(serialized, { xp: plugin.xpReward || 10, coins: plugin.coinReward || 1 });
        if (activity.levelUp && serialized.isGroup && levelNotifyEnabled(serialized.chat)) {
          const levelImage = await renderLevelUpCanvas(activity.user, activity.oldLevel, activity.reward);
          await serialized.send({ image: levelImage, caption: `*NEXORA LEVEL UP*\n${activity.user.name} mencapai Level ${activity.user.level}!\nReward: ${activity.reward?.name || '-'} [${activity.reward?.rarity || 'common'}]\nEffect: ${activity.reward?.effect || '-'}\nGacha Key +1` });
        }
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
  if (reconnectTimer || stopping || reconnectAttempts >= reconnectConfig.maxAttempts) return;
  reconnectAttempts += 1;
  bot.reconnects += 1;
  const delay = Math.min(reconnectDelay, reconnectConfig.maxDelay);
  console.log(`[WA] reconnect #${reconnectAttempts} dalam ${delay}ms`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, reconnectConfig.maxDelay);
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
  stopRuntimeWeb();
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
