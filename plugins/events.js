export default { version:'17.0.0', 
  name:'events', aliases:['event','eventlog'], ownerOnly:true, nonDisableable:true,
  usage:'events [status|clear]', help:'Monitor event Baileys secara ringkas',
  async execute({m,bot,args}) {
    if(args[0]==='clear'){ bot.eventMonitor.counts.clear(); bot.eventMonitor.last=null; return m.reply({text:'Event monitor di-clear.'}); }
    const counts=Object.fromEntries(bot.eventMonitor.counts||[]);
    return m.reply({text:`*NEXORA EVENTS*\nEnabled: ${bot.eventMonitor.enabled?'YES':'NO'}\n${Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join('\n')||'Belum ada event.'}\nLast: ${bot.eventMonitor.last?.name||'-'}`});
  }
};
