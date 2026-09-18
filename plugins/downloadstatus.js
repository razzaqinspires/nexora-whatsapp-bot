import { downloaderHealth } from '../services/downloader.js';
export default {name:'downloadstatus',version:'15.0.3',aliases:['dlstatus'],usage:'downloadstatus',help:'Cek engine downloader',ownerOnly:true,async execute({m}){const h=await downloaderHealth();return m.reply({text:`*DOWNLOADER*\n${h.ok?'READY':'NOT READY'}${h.version?`\n${h.version}`:`\n${h.error}`}`});}};
