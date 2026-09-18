import { extractReplyPayload } from '../services/message-extractor.js';
import { installPluginFromSource } from '../installer/plugin-installer.js';

export default { version:'17.0.0', 
  name: 'addcmd',
  aliases: ['addcommand','installcmd'],
  ownerOnly: true,
  nonDisableable: true,
  usage: 'addcmd',
  help: 'Tambah plugin dari reply text/TXT/JPG/JPEG/PNG/PDF dengan validasi dan auto-kategori',
  async execute({m,router,reloadPlugins}) {
    if (!m.isOwner) return m.reply({text:'Akses ditolak.'});
    const payload=await extractReplyPayload(m);
    if(payload.kind==='none') return m.reply({text:'Reply text atau media JPG/JPEG/PNG/PDF/TXT lalu ketik .addcmd.'});
    if(!payload.text?.trim()) return m.reply({text:'Tidak ada teks/kode yang berhasil diekstrak.'});
    const result=await installPluginFromSource(payload.text,router);
    const lines=[`SOURCE: ${payload.kind.toUpperCase()}`,`STATUS: ${result.ok?'VALID':'DITOLAK'}`,
      `COMMAND: ${result.plan?.name||'-'}`,`FOLDER: ${result.plan?.folder||'-'}`,`FILE: ${result.plan?.file||'-'}`,`CONFIDENCE: ${Math.round((result.plan?.confidence||0)*100)}%`];
    if(result.validation?.warnings?.length) lines.push(`WARNING:\n- ${result.validation.warnings.join('\n- ')}`);
    if(result.validation?.errors?.length) lines.push(`ERROR:\n- ${result.validation.errors.join('\n- ')}`);
    if(!result.ok) return m.reply({text:`*NEXORA COMMAND INSTALLER*\n${lines.join('\n')}`});
    await reloadPlugins();
    return m.reply({text:`*NEXORA COMMAND INSTALLER*\n${lines.join('\n')}\n\nPlugin berhasil dipasang dan router diperbarui.`});
  }
};
