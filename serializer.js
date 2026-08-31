/**
 * Normalizes a Baileys message into a small framework-independent shape.
 */
export function serializeMessage(sock, msg) {
  const key = msg?.key ?? {};
  const remoteJid = key.remoteJid || '';
  const participant = key.participant || key.remoteJid || '';
  const pushName = msg?.pushName || '';
  const text = extractText(msg);
  const commandText = text.trim();

  return {
    raw: msg,
    id: key.id || '',
    chat: remoteJid,
    sender: participant,
    pushName,
    text,
    commandText,
    isGroup: remoteJid.endsWith('@g.us'),
    isFromMe: Boolean(key.fromMe),
    reply: async (content, options = {}) => sock.sendMessage(remoteJid, content, { quoted: msg, ...options }),
    send: async (content, options = {}) => sock.sendMessage(remoteJid, content, options),
  };
}

function extractText(msg) {
  const m = msg?.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ''
  );
}
