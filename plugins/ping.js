export default { name: 'ping', async execute({ m }) { await m.reply(`Pong. ${Date.now()}ms`); } };
