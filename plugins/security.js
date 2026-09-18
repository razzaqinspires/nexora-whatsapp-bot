import { securitySummary } from '../lib/security.js';
export default { version:'17.0.0', name:'security',ownerOnly:true,usage:'security',help:'Lihat ringkasan security',async execute({m,config}){await m.reply({text:securitySummary(config)});}};
