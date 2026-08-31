import { askAI } from './ai.js';

const pillars = ['AI', 'Robotics', 'Arduino', 'ESP32', 'Raspberry Pi', 'IoT', 'Embedded Systems', 'Future Tech'];

export async function buildNexoraContent({ slot = 'manual', seed = Date.now() } = {}) {
  const pillar = pillars[seed % pillars.length];
  const ai = await askAI(`Buat konten Instagram NEXORA berbahasa Indonesia. Pilar: ${pillar}. Slot: ${slot}. Berikan JSON valid dengan field: title, hook, caption, slides (array 1-5, setiap item object {headline,body}), hashtags (maks 5), literacyId. Gaya edukatif, singkat, faktual, jangan mengarang spesifikasi.`);
  if (ai) {
    try { return JSON.parse(ai.replace(/```json|```/g, '').trim()); } catch { /* fallback */ }
  }
  const literacyId = `NX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(seed).slice(-4)}`;
  return {
    literacyId, pillar,
    title: `${pillar}: konsep yang perlu kamu pahami`,
    hook: `Jangan cuma pakai ${pillar}. Pahami cara kerjanya.`,
    caption: `Literasi NEXORA ${literacyId}\n\nHari ini kita membahas dasar ${pillar}. Simpan postingan ini untuk dipelajari lagi.`,
    slides: [
      { headline: 'NEXORA LITERASI', body: `${pillar}` },
      { headline: 'Apa itu?', body: `Pahami konsep dasar ${pillar} sebelum masuk ke proyek yang lebih kompleks.` },
      { headline: 'Kenapa penting?', body: 'Fondasi yang kuat membuat eksperimen dan pengembangan produk lebih terarah.' },
      { headline: 'Mulai dari mana?', body: 'Pelajari konsep, coba proyek kecil, ukur hasil, lalu iterasi.' },
      { headline: 'NEXORA', body: 'Teknologi untuk dipelajari, dibangun, dan dikembangkan.' }
    ],
    hashtags: ['#NEXORA', '#AI', '#Robotika', '#IoT', '#Teknologi']
  };
}
