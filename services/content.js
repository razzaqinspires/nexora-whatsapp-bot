import { uid, today } from '../lib/utils.js';

const pillars = [
  'AI & produktivitas', 'Arduino & ESP32', 'Raspberry Pi & embedded',
  'IoT praktis', 'Robotika', 'Elektronik dasar', 'Teknologi masa depan'
];
const angles = ['edukasi singkat', 'myth vs fact', 'tutorial mini', 'tips praktis', 'kesalahan pemula', 'roadmap belajar'];

export function buildLocalContent() {
  const pillar = pillars[Math.floor(Math.random() * pillars.length)];
  const angle = angles[Math.floor(Math.random() * angles.length)];
  const id = uid('NX');
  const topic = `${pillar}: ${angle}`;
  return {
    id,
    date: today(),
    format: 'carousel',
    pillar,
    angle,
    topic,
    slides: [
      { title: 'NEXORA', body: topic, type: 'hook' },
      { title: 'Kenapa ini penting?', body: `Pahami konsep ${pillar.toLowerCase()} tanpa istilah yang bertele-tele.`, type: 'education' },
      { title: '3 poin utama', body: 'Mulai dari konsep dasar → praktik kecil → evaluasi hasil.', type: 'education' },
      { title: 'Langkah pertama', body: 'Pilih satu proyek mini yang bisa selesai hari ini dan dokumentasikan hasilnya.', type: 'action' },
      { title: 'Simpan & ikuti', body: 'Simpan postingan ini untuk referensi belajar teknologi berikutnya.', type: 'cta' }
    ],
    caption: `${topic}.\n\nBelajar teknologi paling efektif bukan dengan menunggu siap, tetapi dengan membangun proyek kecil secara konsisten.\n\n#NEXORA #AI #Robotika #IoT #Teknologi`,
    status: 'draft'
  };
}

export async function generateContent(ai) {
  if (!ai?.enabled) return buildLocalContent();
  try {
    const response = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.apiKey}` },
      body: JSON.stringify({
        model: ai.model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: 'Kamu adalah content strategist NEXORA Indonesia. Buat konten edukasi teknologi yang akurat, praktis, singkat, tidak clickbait berlebihan.' },
          { role: 'user', content: 'Buat satu ide carousel 5 slide untuk Instagram NEXORA, lengkap dengan hook, isi, CTA, caption, dan maksimal 5 hashtag. Kembalikan JSON valid: {topic, pillar, slides:[{title,body}], caption}.' }
        ]
      })
    });
    if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/^```json\s*|```$/g, '').trim();
    const parsed = JSON.parse(clean);
    return { id: uid('NX'), date: today(), format: 'carousel', ...parsed, status: 'draft' };
  } catch (error) {
    return { ...buildLocalContent(), aiFallback: true, aiError: error.message };
  }
}
