import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function ensureMediaDir() {
  const dir = path.resolve('media/generated');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function escapeXml(value = '') {
  return String(value).replace(/[<>&\"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}

export async function makeCarouselImages(content) {
  const dir = await ensureMediaDir();
  const outputs = [];
  for (let i = 0; i < (content.slides || []).length; i++) {
    const slide = content.slides[i];
    const title = escapeXml(slide.title);
    const body = escapeXml(slide.body);
    const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1080" fill="#111111"/>
      <text x="80" y="120" font-family="Arial" font-size="42" font-weight="700" fill="#ffffff">NEXORA</text>
      <text x="80" y="250" font-family="Arial" font-size="68" font-weight="700" fill="#ffffff">${title}</text>
      <foreignObject x="80" y="330" width="920" height="500">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:44px;line-height:1.35;color:white;white-space:pre-wrap">${body}</div>
      </foreignObject>
      <text x="80" y="990" font-family="Arial" font-size="30" fill="#bbbbbb">${i + 1}/${content.slides.length} • ${escapeXml(content.id)}</text>
    </svg>`;
    const out = path.join(dir, `${content.id}-${String(i + 1).padStart(2, '0')}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(out);
    outputs.push(out);
  }
  return outputs;
}
