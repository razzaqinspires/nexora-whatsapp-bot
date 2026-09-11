export default { name:'ping', usage:'ping', help:'Cek respons bot', async execute({m}) { const t=Date.now(); await m.reply({text:`Pong. ${Date.now()-t}ms`}); } };
