export const RARITY_RATES = Object.freeze({ common: 60, rare: 25, epic: 10, mythic: 4, legendary: 1 });
export const MAX_EQUIPPED = 3;
export function levelFromXp(xp = 0) { return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1); }
export function levelBounds(level) { return { current: Math.max(0, (level - 1) ** 2 * 100), next: level ** 2 * 100 }; }
export function levelProgress(xp = 0) { const level=levelFromXp(xp), {current,next}=levelBounds(level), span=Math.max(1,next-current); return {level,current,next,progress:Math.max(0,Math.min(100,Math.round(((xp-current)/span)*100)))}; }
export function rankForLevel(level) { if(level>=100)return 'NEXORA LEGEND'; if(level>=75)return 'Mythic'; if(level>=50)return 'Elite'; if(level>=30)return 'Master'; if(level>=20)return 'Expert'; if(level>=10)return 'Advanced'; if(level>=5)return 'Ranger'; return 'Rookie'; }
