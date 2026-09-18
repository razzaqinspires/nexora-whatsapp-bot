import { downloadMedia, cleanupDownload } from '../services/downloader.js';
import { ensureYtDlp } from '../services/runtime-deps.js';
async function send({m,args,audio=false,search=false,label='DOWNLOAD'}){const q=args.join(' ').trim();if(!q)return m.reply({text:`Gunakan: .${label.toLowerCase()} <url/query>`});let d;try{const dep=await ensureYtDlp({background:true}); await m.reply({text:dep.pending?`⏳ ${label}: yt-dlp belum ada. Instalasi dimulai di background; tunggu sebentar lalu ulangi command.`:`⏳ ${label}: memproses...`}); if(dep.pending)return; d=await downloadMedia(q,{audio,search});const mime=audio?'audio/mpeg':'video/mp4';await m.send({document:await import('node:fs/promises').then(x=>x.readFile(d.file)),mimetype:mime,fileName:d.title});return m.reply({text:`${label} selesai • ${(d.size/1024/1024).toFixed(1)} MB`});}catch(e){return m.reply({text:`${label} gagal: ${e.message}`});}finally{await cleanupDownload(d);}}
export const handlers={
 download:{name:'download',version:'17.0.0',aliases:['dl'],usage:'download <url>',help:'Downloader universal via yt-dlp',execute:c=>send({...c,label:'DOWNLOAD'})},
 ytdl:{name:'ytdl',version:'17.0.0',usage:'ytdl <url>',help:'YouTube/general video downloader',execute:c=>send({...c,label:'YTDL'})},
 play:{name:'play',version:'17.0.0',usage:'play <query>',help:'Cari dan ambil video pertama',execute:c=>send({...c,search:true,label:'PLAY'})},
 ttdl:{name:'ttdl',version:'17.0.0',usage:'ttdl <url>',help:'TikTok downloader',execute:c=>send({...c,label:'TTDL'})},
 igdl:{name:'igdl',version:'17.0.0',usage:'igdl <url>',help:'Instagram downloader',execute:c=>send({...c,label:'IGDL'})},
 fbdl:{name:'fbdl',version:'17.0.0',usage:'fbdl <url>',help:'Facebook downloader',execute:c=>send({...c,label:'FBDL'})},
 ytmp3:{name:'ytmp3',version:'17.0.0',usage:'ytmp3 <url/query>',help:'Ambil audio MP3',execute:c=>send({...c,audio:true,search:true,label:'YTMP3'})}
};
