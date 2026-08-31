export default {
  name: 'menu',
  aliases: ['help'],
  async execute({ m }) {
    await m.reply(`╭─〔 NEXORA BOT v2 〕
│ /menu
│ /menu help
│ /status
│ /ping
│ /nexora <query>
│ /autoupload --ig on
│ /autoupload --ig off
│ /autoupload --ig now
│ /autoupload --ig schedule
│ /autoupload --ig slots
│ /autoupload --ig login
╰────────────────`);
  }
};
