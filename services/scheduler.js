import cron from 'node-cron';
import { config } from '../lib/config.js';
import { getState, getDailyCount, recordPost, incrementStat } from '../lib/state.js';
import { buildNexoraContent } from './content.js';
import { renderSlides } from './media.js';
import { uploadPhoto } from './instagram.js';
import { JobQueue } from '../lib/job-queue.js';

let tasks=[]; let queue=new JobQueue({concurrency:1}); let lastRun=0;
export function startScheduler(){stopScheduler(); if(getState().schedulerPaused)return;for(const slot of config.automation.slots){const [h,m]=slot.split(':').map(Number);if(!Number.isInteger(h)||!Number.isInteger(m)||h<0||h>23||m<0||m>59)continue;tasks.push(cron.schedule(`${m} ${h} * * *`,()=>enqueueScheduledPost(slot),{timezone:config.timezone}));}}
export function stopScheduler(){tasks.forEach(t=>t.stop());tasks=[];}
function enqueueScheduledPost(slot){const id=`${new Date().toISOString().slice(0,10)}:${slot}`;queue.add(id,()=>runScheduledPost(slot));}
export async function runScheduledPost(slot='manual'){
  if(slot!=='manual' && getState().schedulerPaused)return {skipped:true,reason:'scheduler-paused'};
  if(slot!=='manual' && !getState().autoUpload)return {skipped:true,reason:'autoupload-off'};
  if(getDailyCount()>=config.automation.maxDailyPosts)return {skipped:true,reason:'daily-limit'};
  if(Date.now()-lastRun<config.automation.cooldownMinutes*60000)return {skipped:true,reason:'cooldown'};
  lastRun=Date.now(); await incrementStat('jobs'); let error;
  for(let attempt=0;attempt<=config.automation.retryAttempts;attempt++){
    try{const content=await buildNexoraContent({slot});const media=await renderSlides(content);const result=await uploadPhoto(media,`${content.caption}\n\n${content.hashtags.join(' ')}`);await recordPost({slot,literacyId:content.literacyId,pillar:content.pillar,result});return {content,media,result,attempt};}
    catch(e){error=e;if(attempt<config.automation.retryAttempts)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}
  }
  await incrementStat('jobErrors');
  throw error;
}
export function schedulerStatus(){return {slots:config.automation.slots,queueSize:queue.size,active:queue.activeCount,lastRun,paused:getState().schedulerPaused};}
