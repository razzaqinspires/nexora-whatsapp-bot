export default { name: 'reload', ownerOnly: true, async execute({ m, reloadPlugins }) { const count = await reloadPlugins(); await m.reply(`Plugin berhasil di-reload. ${count} plugin aktif.`); } };
