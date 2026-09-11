import { buildNexoraContent } from '../services/content.js';
export default {
  name: 'nexora', aliases: ['nx'],
  async execute({ m, rawArgs }) {
    const query = rawArgs.trim() || 'beri satu ide konten teknologi masa depan';
    const content = await buildNexoraContent({ slot: query, seed: query.length + Date.now() });
    await m.reply({ text: `*${content.title}*\n\n${content.hook}\n\n${content.caption}\n\n${content.hashtags.join(' ')}\n\nLiterasi: ${content.literacyId}` });
  }
};
