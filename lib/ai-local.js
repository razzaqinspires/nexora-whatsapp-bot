export function localAssistant(prompt='') {
  const q=String(prompt).trim();
  const l=q.toLowerCase();
  if (/^(halo|hai|hi|hello|pagi|siang|malam)\b/.test(l)) return 'Halo! 👋 Aku NEXORA. Provider AI sedang tidak tersedia, tapi command lokal tetap aktif. Kamu bisa tanya sesuatu, atau gunakan .menu untuk melihat fitur.';
  if (/^(siapa kamu|kamu siapa)/.test(l)) return 'Aku NEXORA, asisten AI di dalam NEXORA Bot. Saat provider eksternal tersedia, aku akan memakai AI provider dengan smart fallback.';
  if (/help|bantuan|menu/.test(l)) return 'Ketik .menu untuk command, .status untuk status bot, atau .ping untuk latency dan live runtime.';
  return `NEXORA menerima: “${q}”\n\nAI provider eksternal sedang tidak tersedia. Pesan ini dijawab oleh local fallback agar .ask tetap responsif.`;
}
