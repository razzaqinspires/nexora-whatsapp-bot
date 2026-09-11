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
  const media = detectMedia(msg);
  const premium = getState().premiumUsers.some(jid => identity.all.some(candidate => sameUser(candidate, jid)));
  const owner = isOwner(identity.all, config);
  const admin = owner || Boolean(groupInfo?.isSenderAdmin) || isConfiguredAdmin(identity.all, config);

  return {
    raw: msg,
    key,
    id: key.id || '',
    chat: remoteJid,
    sender,
    pushName: msg?.pushName || '',
    text,
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
    getQuotedMessage: () => buildQuotedMessage(msg)
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
  return m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId || '';
}
