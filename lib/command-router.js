import { getState } from './state.js';

export function createCommandRouter() {
  let plugins=[];
  return {
    setPlugins(next){ plugins=next||[]; },
    list(){ return [...plugins]; },
    resolve(name){
      const key=String(name||'').toLowerCase();
      const p=plugins.find(x=>String(x.name).toLowerCase()===key || x.aliases?.some(a=>String(a).toLowerCase()===key));
      if (p && p.nonDisableable!==true && getState().disabledPlugins.includes(p.name)) return null;
      return p;
    },
    suggest(name, limit=5){
      const key=String(name||'').toLowerCase();
      return plugins.map(p=>({p,d:similarity(key,String(p.name).toLowerCase())})).sort((a,b)=>b.d-a.d).slice(0,limit).filter(x=>x.d>=0.35).map(x=>x.p);
    },
    help(prefix){
      return plugins.filter(p=>p.hidden!==true && (p.nonDisableable===true || !getState().disabledPlugins.includes(p.name)))
        .sort((a,b)=>String(a.category||'core').localeCompare(String(b.category||'core')) || String(a.name).localeCompare(String(b.name)))
        .map(p=>`${prefix}${p.usage||p.name} [v${p.version||'17.0.0'}]${p.help?` — ${p.help}`:''}`);
    },
    disabled(){ return [...getState().disabledPlugins]; }
  };
}
function similarity(a,b){
  if(a===b)return 1; if(!a||!b)return 0;
  const dist=levenshtein(a,b); return 1-dist/Math.max(a.length,b.length);
}
function levenshtein(a,b){const dp=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)dp[0][j]=j;for(let i=1;i<=a.length;i++){for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));}return dp[a.length][b.length];}
export { similarity };
