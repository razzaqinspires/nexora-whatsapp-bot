import { securitySummary } from '../lib/security.js';
export default {name:'security',ownerOnly:true,usage:'security',help:'Lihat ringkasan security',async execute({m,config}){await m.reply({text:securitySummary(config)});}};
