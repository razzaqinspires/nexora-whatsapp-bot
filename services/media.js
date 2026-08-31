import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function renderSlides(content) {
  await fs.mkdir('./media', { recursive: true });
  const paths = [];
  for (let i = 0; i < content.slides.length; i++) {
    const s = content.slides[i];
    const text = escapeSvg(`${s.headline}\n${s.body}`);
    const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="#111"/><text x="90" y="170" fill="#fff" font-family="Arial" font-size="56" font-weight="700"><tspan x="90" dy="0">${text.split('\\n')[0]}</tspan><tspan x="90" dy="95" font-size="42" font-weight="400">${text.split('\\n').slice(1).join(' ')}</tspan></text><text x="90" y="950" fill="#aaa" font-family="Arial" font-size="32">NEXORA • LITERASI</text></svg>`;
    const file = path.resolve('./media', `nexora-${Date.now()}-${i + 1}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(file);
    paths.push(file);
  }
  return paths;
}

function escapeSvg(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
