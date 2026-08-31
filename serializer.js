export function serializeMessage(sock, msg) {
  const key = msg?.key ?? {};
  const remoteJid = key.remoteJid || '';
  const sender = key.participant || key.remoteJid || '';
  const text = extractText(msg);
  const reply = async (content, options = {}) => sock.sendMessage(remoteJid, content, { quoted: msg, ...options });
  return {
    raw: msg,
    id: key.id || '',
    chat: remoteJid,
    sender,
    pushName: msg?.pushName || '',
    text,
    isGroup: remoteJid.endsWith('@g.us'),
    isFromMe: Boolean(key.fromMe),
    reply,
    send: async (content, options = {}) => sock.sendMessage(remoteJid, content, options),
    react: async (emoji) => sock.sendMessage(remoteJid, { react: { text: emoji, key } }),
    delete: async () => sock.sendMessage(remoteJid, { delete: key }),
  };
}

function extractText(msg) {
  const m = msg?.message;
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
