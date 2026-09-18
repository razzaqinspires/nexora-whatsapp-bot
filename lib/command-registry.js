export function normalizeCommandName(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/-+/g, '-');
}

export function commandKeys(plugin) {
  return [plugin?.name, ...(plugin?.aliases || [])].map(normalizeCommandName).filter(Boolean);
}

export function findConflicts(candidate, plugins) {
  const keys = commandKeys(candidate);
  const exact = [];
  const similar = [];
  for (const p of plugins || []) {
    for (const key of commandKeys(p)) {
      if (keys.includes(key)) exact.push({ plugin: p.name, key });
      for (const k of keys) {
        if (similarity(k, key) >= 0.82 && k !== key) similar.push({ plugin: p.name, key, candidate: k, score: similarity(k,key) });
      }
    }
  }
  return { exact: dedupe(exact), similar: dedupe(similar) };
}

export function similarity(a,b) {
  const max=Math.max(a.length,b.length); if(!max) return 1;
  return 1 - levenshtein(a,b)/max;
}
function levenshtein(a,b){ const d=Array.from({length:a.length+1},(_,i)=>[i]); for(let j=1;j<=b.length;j++) d[0][j]=j; for(let i=1;i<=a.length;i++){ d[i]=[i]; for(let j=1;j<=b.length;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } return d[a.length][b.length]; }
function dedupe(a){ return [...new Map(a.map(x=>[JSON.stringify(x),x])).values()]; }
