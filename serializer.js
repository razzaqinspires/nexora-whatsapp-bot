import { createRequire } from 'node:module';
import {
  areJidsSameUser,
  downloadMediaMessage,
  getContentType,
  isJidGroup,
  isJidNewsletter,
  isLidUser,
  isPnUser,
  jidNormalizedUser,
  normalizeMessageContent
} from '@whiskeysockets/baileys';
import { isOwner, sameUser } from './lib/security.js';
import { getState } from './lib/state.js';
import { isPremium as isPremiumUser } from './lib/access.js';

const require = createRequire(import.meta.url);
let compat = null;
try { compat = require('./serializer-compat.cjs'); } catch (error) { console.warn('[SERIALIZER] compatibility layer unavailable:', error.message); }

/**
 * V7 message serializer.
 *
 * Baileys v6/v7 may expose a LID in key.remoteJid while a PN is available
 * through remoteJidPn / remoteJidAlt. Never infer a phone number from the
 * numeric part of @lid: LID is an opaque identifier.
 */
export async function serializeMessage(sock, msg, config = {}, bot = {}) {
  const key = msg?.key ?? {};
  const remoteJid = key.remoteJid || '';
  const group = isJidGroup(remoteJid);
  const identity = buildIdentity(key, group);
  const sender = identity.primary || remoteJid;
  const isFromMe = Boolean(key.fromMe);
  const botJids = getBotJids(sock, bot);
  const isBot = isFromMe || identity.all.some(jid => botJids.some(botJid => sameUser(jid, botJid)));
  const groupInfo = group ? await buildGroupInfo(sock, remoteJid, sender, botJids) : null;
  const validation = validateMessageShape(msg, key, remoteJid, identity, groupInfo);
  const role = resolveRole(identity.all, sender, config, groupInfo);
  const normalizeContent = content => {
    if (content == null) return { text: '' };
    if (typeof content === 'string') return { text: content };
    if (Buffer.isBuffer(content) || content instanceof Uint8Array) return { document: content };
    if (typeof content !== 'object') return { text: String(content) };
    return content;
  };
  const reply = async (content, options = {}) => sock.sendMessage(remoteJid, normalizeContent(content), { quoted: msg, ...options });
  const send = async (content, options = {}) => sock.sendMessage(remoteJid, normalizeContent(content), options);
  const react = emoji => sock.sendMessage(remoteJid, { react: { text: String(emoji), key } });
  const remove = () => sock.sendMessage(remoteJid, { delete: key });
  const download = async (target = msg, options = {}) => downloadMediaMessage(target, 'buffer', options, sock);

  const text = extractText(msg);
  const body = text;
  const selectedButtonId = extractInteractiveId(msg);
  const media = detectMedia(msg);
  const premium = isPremiumUser(identity.all, config);
  const owner = isOwner(identity.all, config);
  const admin = owner || Boolean(groupInfo?.isSenderAdmin) || isConfiguredAdmin(identity.all, config);

  return {
    raw: msg,
    validation,
    key,
    id: key.id || '',
    chat: remoteJid,
    sender,
    pushName: msg?.pushName || '',
    text,
    body,
    selectedButtonId,
    isGroup: group,
    isPrivate: !group,
    isNotGroup: !group,
    isNotPrivate: group,
    isNewsletter: isJidNewsletter(remoteJid),
    isFromMe,
    isBot,
    isSelf: isBot,
    isOwner: owner,
    isAdmin: admin,
    isPremium: premium,
    isGroupAdmin: Boolean(groupInfo?.isSenderAdmin),
    isGroupOwner: Boolean(groupInfo?.isSenderOwner),
    isBotAdmin: Boolean(groupInfo?.isBotAdmin),
    isBotGroupOwner: Boolean(groupInfo?.isBotOwner),
    isNotOwner: !owner,
    isNotAdmin: !admin,
    isNotPremium: !premium,
    isNotBotAdmin: !groupInfo?.isBotAdmin,
    isNotGroupAdmin: !groupInfo?.isSenderAdmin,
    isNotGroupOwner: !groupInfo?.isSenderOwner,
    isNotBotOwner: !groupInfo?.isBotOwner,
    isNotFromMe: !isFromMe,
    role,
    identity,
    media,
    group: groupInfo,
    reply,
    send,
    react,
    delete: remove,
    download,
    getQuotedMessage: () => buildQuotedMessage(msg),
    // V15 compatibility surface inspired by the supplied legacy serializer.
    freply: compat?.freply || null,
    createFakeReply: (type, options = {}) => compat?.createFakeReply?.(type, options) || null,
    sendInteractive: (data = {}) => typeof sock.sendInteractive === 'function' ? sock.sendInteractive(remoteJid, data, msg) : Promise.reject(new Error('Interactive helper not attached.')),
    sendRichMessage: (submessages, options = {}) => sock.sendRichMessage?.(remoteJid, submessages, { ...msg, ...buildQuotedMessage(msg) }, options),
    sendList: (title, items, options = {}) => sock.sendList?.(remoteJid, title, items, msg, options),
    freply: compat?.freply || null,
    fReply: (type='trolley', options={}) => compat?.createFakeReply?.(type, options) || null,
    fake: compat?.freply || null,
    airich: () => sock.airich?.(),
    rich: () => sock.richMessage?.() || sock.airich?.(),
    buttonBuilder: () => sock.buttonBuilder?.(),
    buttonV2Builder: () => sock.buttonV2Builder?.(),
    carouselBuilder: () => sock.carouselBuilder?.()
  };
}

function buildIdentity(key, isGroup) {
  const values = isGroup
    ? [key.participantPn, key.participantAlt, key.participant, key.participantLid]
    : [key.remoteJidPn, key.remoteJidAlt, key.remoteJid, key.remoteJidLid];
  const all = uniqueJids(values);
  const pn = all.find(isPnUser) || '';
  const lid = all.find(isLidUser) || '';
  return { primary: pn || all[0] || '', pn, lid, all };
}

function getBotJids(sock, bot) {
  return uniqueJids([
    bot.userJid,
    sock?.user?.id,
    sock?.user?.lid,
    sock?.authState?.creds?.me?.id,
    sock?.authState?.creds?.me?.lid
  ]);
}

function uniqueJids(values) {
  return [...new Set(values.flatMap(value => String(value || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean)))];
}

function isConfiguredAdmin(identity, config) {
  return identity.some(jid => [...config.security.adminJids].some(admin => sameUser(jid, admin)));
}

function resolveRole(identity, sender, config, groupInfo) {
  if (isOwner(identity, config)) return 'owner';
  if (groupInfo?.isSenderAdmin || isConfiguredAdmin(identity, config)) return 'admin';
  if (getState().premiumUsers.some(jid => identity.some(candidate => sameUser(candidate, jid)))) return 'premium';
  return 'user';
}

async function buildGroupInfo(sock, groupJid, sender, botJids) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const participants = metadata?.participants || [];
    const senderParticipant = participants.find(p => matchesParticipant(p, sender));
    const botParticipant = participants.find(p => botJids.some(jid => matchesParticipant(p, jid)));
    const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const ownerCandidates = [metadata?.owner, metadata?.ownerPn, metadata?.subjectOwner, metadata?.subjectOwnerPn].filter(Boolean);
    return {
      id: metadata?.id || groupJid,
      subject: metadata?.subject || '',
      description: metadata?.desc || '',
      size: metadata?.size ?? participants.length,
      owner: metadata?.owner || '',
      ownerPn: metadata?.ownerPn || '',
      ownerUsername: metadata?.ownerUsername || '',
      subjectOwner: metadata?.subjectOwner || '',
      subjectOwnerPn: metadata?.subjectOwnerPn || '',
      addressingMode: metadata?.addressingMode || '',
      announce: Boolean(metadata?.announce),
      restrict: Boolean(metadata?.restrict),
      memberAddMode: Boolean(metadata?.memberAddMode),
      joinApprovalMode: Boolean(metadata?.joinApprovalMode),
      isCommunity: Boolean(metadata?.isCommunity),
      isCommunityAnnounce: Boolean(metadata?.isCommunityAnnounce),
      linkedParent: metadata?.linkedParent || '',
      inviteCode: metadata?.inviteCode || '',
      participants,
      admins,
      ownerCandidates,
      isSenderAdmin: Boolean(senderParticipant?.admin),
      isSenderOwner: ownerCandidates.some(owner => sameUser(owner, sender)),
      isBotAdmin: Boolean(botParticipant?.admin),
      isBotOwner: ownerCandidates.some(owner => botJids.some(jid => sameUser(owner, jid))),
      senderParticipant: senderParticipant || null,
      botParticipant: botParticipant || null
    };
  } catch (error) {
    return { id: groupJid, subject: '', description: '', size: 0, participants: [], admins: [], metadataError: error.message, isSenderAdmin: false, isSenderOwner: false, isBotAdmin: false, isBotOwner: false };
  }
}

function matchesParticipant(participant, jid) {
  return [participant?.id, participant?.phoneNumber, participant?.lid].filter(Boolean).some(value => sameUser(value, jid));
}

function buildQuotedMessage(source) {
  const ctx = source?.message?.extendedTextMessage?.contextInfo;
  if (!ctx?.quotedMessage) return null;
  return {
    key: { remoteJid: source.key?.remoteJid, id: ctx.stanzaId, participant: ctx.participant || ctx.participantAlt, participantAlt: ctx.participantAlt },
    message: ctx.quotedMessage
  };
}

function detectMedia(msg) {
  const content = normalizeMessageContent(msg?.message);
  const type = getContentType(content) || '';
  const supported = ['imageMessage', 'videoMessage', 'documentMessage', 'stickerMessage', 'audioMessage'];
  return { type, hasMedia: supported.includes(type), canUploadToInstagram: type === 'imageMessage' || type === 'videoMessage' };
}

export function extractText(msg) {
  const m = normalizeMessageContent(msg?.message);
  if (!m) return '';
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.documentMessage?.caption) return m.documentMessage.caption;
  if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId;
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) return m.listResponseMessage.singleSelectReply.selectedRowId;
  if (m.templateButtonReplyMessage?.selectedId) return m.templateButtonReplyMessage.selectedId;
  const native=m.interactiveResponseMessage?.nativeFlowResponseMessage;
  if (native?.buttonReply?.id) return native.buttonReply.id;
  if (m.nativeFlowResponseMessage?.buttonReply?.id) return m.nativeFlowResponseMessage.buttonReply.id;
  if (m.nativeFlowResponseMessage?.paramsJson) { try { const p=JSON.parse(m.nativeFlowResponseMessage.paramsJson); return p.id || p.row_id || p.rowId || p.selected_id || p.selectedId || p.command || ''; } catch {} }
  if (native?.paramsJson) {
    try { const p=JSON.parse(native.paramsJson); return p.id || p.button_id || p.selectedId || p.rowId || p.command || p.params || ''; } catch { return String(native.paramsJson); }
  }
  return '';
}


export function attachSerializerRuntime(sock) {
  if (!sock) return sock;
  try { compat?.extendSocket?.(sock); } catch (error) { console.warn('[SERIALIZER] compat socket extension failed:', error.message); }
  return sock;
}

function extractInteractiveId(msg) {
  const m = normalizeMessageContent(msg?.message) || {};
  if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId;
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) return m.listResponseMessage.singleSelectReply.selectedRowId;
  if (m.templateButtonReplyMessage?.selectedId) return m.templateButtonReplyMessage.selectedId;
  const n = m.interactiveResponseMessage?.nativeFlowResponseMessage;
  if (n?.buttonReply?.id) return n.buttonReply.id;
  if (n?.paramsJson) {
    try { const p=JSON.parse(n.paramsJson); return p.id || p.row_id || p.rowId || p.selected_id || p.selectedId || p.command || ''; } catch {}
  }
  return '';
}

export function validateMessageShape(msg = {}, key = {}, remoteJid = '', identity = { all: [] }, groupInfo = null) {
  const errors = [];
  const warnings = [];
  if (!key.id) warnings.push('message key.id kosong');
  if (!remoteJid) errors.push('remoteJid kosong');
  if (!identity.all?.length) errors.push('identity tidak memiliki JID kandidat');
  if (isJidGroup(remoteJid) && !groupInfo) warnings.push('metadata grup tidak tersedia');
  if (key.remoteJid && isLidUser(key.remoteJid) && !key.remoteJidPn && !key.remoteJidAlt) warnings.push('remoteJid adalah LID tanpa PN/Alt; jangan infer nomor dari LID');
  const type = getContentType(normalizeMessageContent(msg?.message)) || '';
  if (type && !['conversation','extendedTextMessage','imageMessage','videoMessage','documentMessage','audioMessage','stickerMessage','buttonsResponseMessage','listResponseMessage','templateButtonReplyMessage','interactiveResponseMessage','pollUpdateMessage','nativeFlowResponseMessage','lottieStickerMessage','viewOnceMessage','ephemeralMessage'].includes(type)) warnings.push(`message type belum dikenal serializer: ${type}`);
  return { ok: errors.length === 0, errors, warnings, messageType: type, identityCandidates: identity.all.length, hasGroupMetadata: Boolean(groupInfo) };
}
