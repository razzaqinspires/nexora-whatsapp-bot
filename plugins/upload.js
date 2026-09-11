import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadInstagramMedia } from '../services/instagram.js';

export default {
  name: 'upload', aliases: ['igupload', 'ig-upload'], ownerOnly: true,
  usage: 'upload [caption] (reply/kirim gambar)',
  help: 'Upload manual media WhatsApp ke Instagram',
  async execute({ m }) {
    const target = resolveTarget(m);
    if (!target?.message) return m.reply({ text: 'Reply/kirim gambar atau video lalu gunakan /upload.' });
    const type = target.message.imageMessage ? 'image' : target.message.videoMessage ? 'video' : '';
    if (!type) return m.reply({ text: 'Media yang didukung: gambar atau video.' });
    const caption = m.text.replace(/^\/upload\s*/i, '').trim() || target.message.imageMessage?.caption || target.message.videoMessage?.caption || '';
    await m.reply({ text: '⏳ Menyiapkan media untuk upload Instagram...' });
    const buffer = await m.download(target);
    await fs.mkdir('./media/manual', { recursive: true });
    const ext = type === 'image' ? 'jpg' : 'mp4';
    const file = path.resolve('./media/manual', `manual-${Date.now()}.${ext}`);
    await fs.writeFile(file, buffer);
    try {
      const result = await uploadInstagramMedia(file, caption, type);
      return m.reply({ text: result.dryRun ? `DRY RUN berhasil.\nFile: ${file}` : `Upload Instagram berhasil.\nMedia ID: ${result.mediaId || '-'}` });
    } finally {
      if (process.env.KEEP_MANUAL_MEDIA !== 'true') await fs.unlink(file).catch(() => {});
    }
  }
};

function resolveTarget(m) {
  if (m.media?.hasMedia) return m.raw;
  return m.getQuotedMessage();
}
