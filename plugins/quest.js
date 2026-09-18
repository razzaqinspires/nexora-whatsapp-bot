import { questList, claimQuest } from '../lib/quests.js';
import { sendButtons, button } from '../services/buttons.js';
export default { name: 'quest', version: '17.0.0', aliases: ['quests', 'misi'], usage: 'quest [list|claim <id>]', category: 'game', help: 'Daily/weekly quest dan reward', async execute({ m, args, prefix }) {
  const a = (args[0] || 'list').toLowerCase();
  if (a === 'claim') { try { const r = await claimQuest(m, args[1]); return sendButtons(m, { text: `*QUEST COMPLETE v17*\n${r.q.name}\n+${r.q.rewardXp} XP • +${r.q.rewardCoins} coin\nItem: ${r.item.name} [${r.item.rarity}]`, footer: 'NEXORA • Quest', buttons: [button(`${prefix}quest`, 'Quest List'), button(`${prefix}inventory`, 'Inventory')] }); } catch (e) { return sendButtons(m, { text: e.message, buttons: [button(`${prefix}quest`, 'Quest List'), button(`${prefix}menu`, 'Menu')] }); } }
  const rows = questList(m).map(q => `${q.claimed ? '✓' : q.progress >= q.target ? '●' : '○'} ${q.id} — ${q.name}\n  ${q.progress}/${q.target} • +${q.rewardXp} XP • +${q.rewardCoins} coin`).join('\n');
  return sendButtons(m, { text: `*NEXORA QUESTS v17*\n\n${rows || 'Belum ada quest.'}\n\n${prefix}quest claim <id>`, footer: 'NEXORA • Quest Actions', buttons: [button(`${prefix}daily`, 'Daily'), button(`${prefix}leaderboard`, 'Leaderboard'), button(`${prefix}menu`, 'Menu')] });
}};
