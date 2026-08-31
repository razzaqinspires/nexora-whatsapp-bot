export default {
  name: 'menu', aliases: ['help'],
  async execute({ m, prefix }) {
    await m.reply(`*NEXORA BOT v3*\n\n${prefix}menu\n${prefix}menu help\n${prefix}status\n${prefix}ping\n${prefix}nexora <query>\n${prefix}autoupload --ig on|off\n${prefix}autoupload --ig now\n${prefix}autoupload --ig schedule\n${prefix}autoupload --ig slots\n${prefix}autoupload --ig login\n${prefix}security\n${prefix}reload`);
  }
};
