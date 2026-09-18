import { startJadibot, stopJadibot, jadibotStatus, allJadibotStatus } from '../services/jadibot.js';
import { isOwner } from '../lib/security.js';
export default {name:'jadibot',version:'15.0.3',aliases:['jbot','subbot'],usage:'jadibot start <nomor> [hari]|status|stop',premiumOnly:true,category:'premium',help:'Premium: jadikan nomor sebagai bot dengan masa aktif/expired',async execute({m,args,config}){
 const action=String(args[0]||'status').toLowerCase(); const owner=m.identity?.pn||m.sender;
 if(action==='status'){const s=jadibotStatus(owner);if(!s)return m.reply({text:'Jadibot: OFF\nGunakan .jadibot start <nomor> [hari].'});return m.reply({text:`*JADIBOT v15.0*\nStatus: ${s.connected?'ONLINE':'OFFLINE'}\nBot: ${s.botJid||'-'}\nExpired: ${s.expiresAt||'-'}\nPairing: ${s.pairingCode||'-'}`});}
 if(action==='list'&&isOwner(owner,config)){return m.reply({text:`*JADIBOT LIST*\n${allJadibotStatus().map((x,i)=>`${i+1}. ${x.owner} • ${x.live?'LIVE':'OFF'} • ${x.expiresAt||'-'}`).join('\n')||'-'}`});}
 if(action==='stop'){await stopJadibot(owner);return m.reply({text:'Jadibot dihentikan dan session runtime dilepas.'});}
 if(action==='start'){const phone=args[1]||owner.split('@')[0];const days=Number(args[2]||7);try{const s=await startJadibot({jid:owner,phone,days,onMessage:null});return m.reply({text:`*JADIBOT START*\nStatus: ${s.connected?'ONLINE':'STARTING'}\nExpired: ${s.expiresAt}\nPairing: ${s.pairingCode||'Scan QR dari terminal jika pairing tidak tersedia.'}`});}catch(e){return m.reply({text:`Jadibot gagal: ${e.message}`});}}
 return m.reply({text:'Gunakan .jadibot start <nomor> [hari] | status | stop'});
}};
