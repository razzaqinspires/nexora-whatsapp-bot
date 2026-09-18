import crypto from 'node:crypto';
import { getState, persistGamification } from './state.js';
import { getUserProfile, userKey } from './gamification.js';
const MAP=[['NEXORA HUB','safe',1],['CYBER FOREST','wild',2],['NEON RUINS','wild',3],['QUANTUM ARENA','arena',4],['SINGULARITY CORE','boss',5]];
export function mapState(m){const u=getUserProfile(m);u.game ||= {node:1,hp:100,energy:100,attack:10,defense:5,wins:0,losses:0};return {u,map:MAP[u.game.node-1]||MAP[0]};}
export async function move(m,direction){const {u}=mapState(m);u.game.node=Math.max(1,Math.min(MAP.length,u.game.node+(direction==='back'? -1:1)));await persistGamification();return mapState(m);}
export async function attack(m,target){const a=mapState(m).u;const b=getState().users[String(target||'').toLowerCase()];if(!b||!b.game)throw new Error('Target player tidak ditemukan.');const power=a.game.attack+Math.floor(Math.random()*8),guard=b.game.defense+Math.floor(Math.random()*6);const damage=Math.max(1,power-guard);b.game.hp=Math.max(0,(b.game.hp??100)-damage);let winner=null;if(b.game.hp===0){a.game.wins++;b.game.losses++;b.game.hp=100;winner=a.id;}await persistGamification();return {damage,winner,target:b};}
export async function duel(m,target){const a=mapState(m).u;const b=getState().users[String(target||'').toLowerCase()];if(!b||!b.game)throw new Error('Target player tidak ditemukan.');const ap=a.game.attack+Math.random()*10+a.game.defense*0.5;const bp=b.game.attack+Math.random()*10+b.game.defense*0.5;const winner=ap>=bp?a:b;const loser=winner===a?b:a;winner.game.wins++;loser.game.losses++;await persistGamification();return {winner,loser};}
export async function tournament(m){const u=mapState(m).u;u.game.tournament={id:crypto.randomUUID(),joinedAt:new Date().toISOString(),status:'registered'};await persistGamification();return u.game.tournament;}
export { MAP };
