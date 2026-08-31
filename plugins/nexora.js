import { createContent } from '../services/ai.js';

export default {
  name: 'nexora',
  async execute({ m, rawArgs }) {
    const q = rawArgs.trim();
    if (!q) return m.reply('Contoh: /nexora ESP32 untuk pemula');
    const original = process.env.AI_BASE_URL;
    const content = await createContent();
    await m.reply(`NEXORA QUERY: ${q}\n\nID: ${content.id}\nTopik: ${content.topic}\nPilar: ${content.pillar}\n\n${(content.slides || []).map((s, i) => `${i + 1}. ${s.title}\n${s.body}`).join('\n\n')}\n\nCAPTION:\n${content.caption}`);
  }
};
