import crypto from 'node:crypto';
import { getUserProfile } from './gamification.js';
import { persistGamification } from './state.js';

const uid=m=>String(m?.identity?.pn||m?.identity?.lid||m?.sender||'').toLowerCase();
const LEVELS=[
 {id:'green-plains',name:'Green Plains',length:18,theme:'grass',enemies:3,coins:12},
 {id:'pipe-cavern',name:'Pipe Cavern',length:22,theme:'cave',enemies:5,coins:16},
 {id:'ember-castle',name:'Ember Castle',length:26,theme:'castle',enemies:7,coins:22}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const MARIO_ACTIONS=['left','right','jump','dash','wait','restart','quit'];
export function marioProfile(m){const u=getUserProfile(m);u.mario??={level:1,world:0,x:1,y:0,vy:0,lives:3,score:0,coins:0,stamina:100,power:'small',running:false,over:false,seed:crypto.randomUUID(),turn:0,flags:{}};return u;}
export function marioWorld(m){const u=marioProfile(m),g=u.mario,w=LEVELS[g.world]||LEVELS[0];return {u,g,w};}
function obstacleAt(g,w,x){if(x<=0||x>=w.length-1)return 'wall';const n=(x*17+g.world*11+String(g.seed).length)%19;if(n===2||n===7)return 'coin';if(n===5||n===13)return 'enemy';if(n===9)return 'gap';return 'ground';}
export async function startMario(m){const {u,g,w}=marioWorld(m);g.running=true;g.over=false;g.world=0;g.x=1;g.y=0;g.vy=0;g.lives=3;g.score=0;g.coins=0;g.power='small';g.stamina=100;g.turn=0;g.seed=crypto.randomUUID();await persistGamification();return marioSnapshot(m);}
export function marioSnapshot(m){const {g,w}=marioWorld(m);return {active:g.running&&!g.over,over:g.over,world:g.world+1,worldId:w.id,worldName:w.name,theme:w.theme,x:g.x,y:g.y,vy:g.vy,lives:g.lives,score:g.score,coins:g.coins,power:g.power,stamina:g.stamina,turn:g.turn,length:w.length,obstacle:obstacleAt(g,w,g.x),progress:Math.round((g.x/(w.length-1))*100)};}
export async function marioAction(m,action='wait'){
 const {u,g,w}=marioWorld(m); if(!g.running||g.over) throw new Error('Mario belum dimulai.'); action=String(action).toLowerCase(); if(!MARIO_ACTIONS.includes(action))throw new Error(`Aksi tidak dikenal: ${action}`);
 if(action==='quit'){g.running=false;await persistGamification();return marioSnapshot(m);}
 if(action==='restart'){return startMario(m);}
 g.turn++; if(action==='left')g.x--; if(action==='right'||action==='dash')g.x+=action==='dash'?2:1;
 if(action==='jump'){g.y=1;g.vy=1;g.score+=5;} else if(g.y>0){g.y=0;g.vy=0;}
 g.stamina=clamp(g.stamina-(action==='dash'?12:action==='jump'?5:1)+ (action==='wait'?4:0),0,100);
 g.x=clamp(g.x,1,w.length-1);
 const hit=obstacleAt(g,w,g.x);
 if(hit==='coin'){g.coins++;g.score+=100;g.flags[`coin-${g.x}`]=true;}
 if(hit==='enemy' && g.y===0){if(g.power==='star'){g.score+=200;}else{g.lives--;g.score=Math.max(0,g.score-50);if(g.lives<=0){g.over=true;g.running=false;}}}
 if(hit==='gap' && g.y===0){g.lives--;if(g.lives<=0){g.over=true;g.running=false;}else g.x=Math.max(1,g.x-2);}
 if(g.x>=w.length-1){g.score+=500; if(g.world<LEVELS.length-1){g.world++;g.x=1;g.y=0;}else{g.over=true;g.running=false;g.flags.complete=true;}}
 u.coins=(u.coins||0)+ (hit==='coin'?1:0);await persistGamification();return marioSnapshot(m);
}
export { LEVELS, obstacleAt, uid };
