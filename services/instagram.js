import fs from 'node:fs/promises';
import path from 'node:path';
import { IgApiClient } from 'instagram-private-api';
import { config } from '../lib/config.js';
let ig=null,loggedIn=false,loginPromise=null,lastError=null;
async function saveSession(client){await fs.mkdir(path.dirname(config.instagram.sessionFile),{recursive:true});await fs.writeFile(config.instagram.sessionFile,JSON.stringify(await client.state.serialize()));}
async function ensureClient(){
 if(loggedIn&&ig)return ig;if(loginPromise)return loginPromise;
 loginPromise=(async()=>{if(!config.instagram.username||!config.instagram.password)throw new Error('IG_USERNAME/IG_PASSWORD belum lengkap.');const client=new IgApiClient();client.state.generateDevice(config.instagram.username);
  try{const raw=await fs.readFile(config.instagram.sessionFile,'utf8');await client.state.deserialize(JSON.parse(raw));await client.account.currentUser();}
  catch{await client.simulate.preLoginFlow();await client.account.login(config.instagram.username,config.instagram.password);await client.simulate.postLoginFlow();await saveSession(client);}
  ig=client;loggedIn=true;lastError=null;return client;
 })().catch(e=>{lastError=e?.message||String(e);loggedIn=false;ig=null;throw e;}).finally(()=>{loginPromise=null});return loginPromise;
}
export async function instagramStatus(){return {configured:Boolean(config.instagram.username&&config.instagram.password),loggedIn,username:config.instagram.username||null,mode:(config.dryRun||!config.instagram.publishEnabled)?'dry-run':'private-api',publishEnabled:config.instagram.publishEnabled,lastError};}
export async function loginInstagram(){await ensureClient();return instagramStatus();}
function canPublish(){return !config.dryRun&&config.instagram.publishEnabled;}
export async function uploadPhoto(mediaPaths,caption=''){const files=Array.isArray(mediaPaths)?mediaPaths:[mediaPaths];if(!canPublish())return {dryRun:true,files,caption,type:files.length>1?'carousel':'photo',reason:config.dryRun?'DRY_RUN=true':'IG_PUBLISH_ENABLED=false'};const client=await ensureClient();const buffers=await Promise.all(files.map(f=>fs.readFile(f)));try{if(buffers.length===1){const result=await client.publish.photo({file:buffers[0],caption});await saveSession(client);return {dryRun:false,type:'photo',mediaId:result?.media?.pk||result?.media?.id||null};}const result=await client.publish.album({items:buffers.map(file=>({file})),caption});await saveSession(client);return {dryRun:false,type:'carousel',mediaId:result?.media?.pk||result?.media?.id||null};}catch(e){lastError=e?.message||String(e);throw e;}}
export async function uploadInstagramMedia(file,caption='',type='image'){if(type==='image')return uploadPhoto(file,caption);if(!canPublish())return {dryRun:true,file,caption,type:'video',reason:config.dryRun?'DRY_RUN=true':'IG_PUBLISH_ENABLED=false'};const client=await ensureClient();const result=await client.publish.video({video:await fs.readFile(file),caption});await saveSession(client);return {dryRun:false,type:'video',mediaId:result?.media?.pk||result?.media?.id||null};}
