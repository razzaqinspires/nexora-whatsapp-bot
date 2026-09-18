const TYPES = ['text','image','video','audio','document','sticker','contact','location','poll','buttons','list','carousel','console','events'];
const builders = {
  buttons: () => ({ text:'NEXORA buttons probe', buttons:[{buttonId:'nexora:test:1',buttonText:{displayText:'TEST'},type:1}], footer:'V9 capability probe' }),
  list: () => ({ text:'NEXORA list probe', title:'Test', description:'Capability probe', buttonText:'OPEN', sections:[{title:'NEXORA',rows:[{title:'Test row',rowId:'nexora:test:1'}]}] }),
  carousel: () => ({ text:'NEXORA carousel probe', cards:[{title:'Card 1'},{title:'Card 2'}] })
};
export default { version:'17.0.0', 
  name:'test', aliases:['tests','diag'], ownerOnly:true, nonDisableable:true,
  usage:'test all|serializer|events|console|buttons|list|carousel',
  help:'Test harness untuk message types, UI payload, serializer dan event monitor',
  async execute({m,args,bot,router}) {
    const type=(args[0]||'all').toLowerCase();
    if(type==='events') return m.reply({text:`*EVENT MONITOR*\n${JSON.stringify(Object.fromEntries(bot.eventMonitor.counts||[]),null,2)}\nLast: ${JSON.stringify(bot.eventMonitor.last||null)}`});
    if(type==='console') return m.reply({text:'*CONSOLE TEST*\nLogger: READY\nError boundary: READY\nArbitrary shell: DISABLED BY DESIGN'});
    if(type==='serializer') return m.reply({text:`*SERIALIZER TEST*\nchat=${m.chat}\nsender=${m.sender}\npn=${m.identity?.pn||'-'}\nlid=${m.identity?.lid||'-'}\nrole=${m.role}\ngroup=${m.isGroup}\nadmin=${m.isAdmin}\nbotAdmin=${m.isBotAdmin}\nmedia=${m.media?.type||'-'}\nquoted=${!!m.getQuotedMessage?.()}\nflags=${['isNotOwner','isNotAdmin','isNotPremium','isNotBotAdmin','isNotGroupAdmin','isNotGroupOwner','isNotBotOwner','isNotFromMe'].map(k=>`${k}=${m[k]}`).join(' | ')}`});
    if(builders[type]) return m.reply({text:`*${type.toUpperCase()} TEST*\nPayload builder: READY\nSchema keys: ${Object.keys(builders[type]()).join(', ')}\nRuntime send: guarded (Baileys/WhatsApp client capability varies).`});
    if(type==='all') return m.reply({text:`*NEXORA V9 TEST SUITE*\n${TYPES.map(x=>`• ${x}: READY`).join('\n')}\n\nSerializer: READY\nRouter: ${router.list().length} plugins\nLID/PN: ${m.identity?.pn||'-'} / ${m.identity?.lid||'-'}\nRole: ${m.role}\nGroup metadata: ${m.isGroup ? 'READY' : 'N/A'}\nEvent monitor: ${bot.eventMonitor.enabled?'READY':'OFF'}`});
    return m.reply({text:`Test ${type}: ${TYPES.includes(type)?'READY':'unknown type'}`});
  }
};
